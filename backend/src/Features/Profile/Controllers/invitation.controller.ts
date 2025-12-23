import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvitationService } from '../Services/invitation.service';
import { SendInvitationRequest, SendInvitationResponse, ValidateInvitationRequest, ValidateInvitationTokenRequest, ValidateInvitationResponse, CompleteSignupRequest, CompleteSignupResponse } from '../Requests/invitation.requests';
import { RequireRoles } from 'src/Common/Infrastructure/decorators/require-roles.decorator';
import { UserType } from 'src/Common/consts/userType';
import { IProfileRepository, CreateUserData } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import { PublicEndpointGuard } from 'src/Common/Infrastructure/decorators/publicEndpoint.decorator';
import { PasswordService } from 'src/Common/ApplicationCore/Features/password.service';
import { TokenService } from 'src/Common/Infrastructure/Services/token.service';
import * as httpContext from 'express-http-context';
import { UserContext } from 'src/Common/Infrastructure/types/user-context.type';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  private readonly logger = new Logger(InvitationController.name);

  constructor(
    private readonly invitationService: InvitationService,
    private readonly profileRepository: IProfileRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  @RequireRoles(UserType.admin, UserType.operator)
  @Post('send')
  async sendInvitations(@Body() request: SendInvitationRequest): Promise<SendInvitationResponse> {
    // Get context information for user creation
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    const accountId = userContext?.accountId;

    // Remove duplicate emails (case-insensitive) from the request
    const uniqueRequestEmails = [...new Set(request.emails.map(email => email.toLowerCase()))];
    
    // Get existing users for this account to check for duplicates
    const existingUsers = await this.profileRepository.getUsersForAccount();
    const existingEmails = new Set(existingUsers.map(user => user.email.toLowerCase()));
    
    // Filter out emails that already exist in the account
    const newEmails = uniqueRequestEmails.filter(email => !existingEmails.has(email));
    const duplicateEmails = uniqueRequestEmails.filter(email => existingEmails.has(email));
    
    // Log duplicate detection
    if (duplicateEmails.length > 0) {
      this.logger.log(`Found ${duplicateEmails.length} duplicate emails in account: ${duplicateEmails.join(', ')}`);
    }
    
    if (newEmails.length === 0) {
      this.logger.warn('All emails are already users in this account');
      return {
        totalProcessed: uniqueRequestEmails.length,
        successful: 0,
        failed: uniqueRequestEmails.length,
        results: uniqueRequestEmails.map(email => ({
          email,
          success: false,
          message: 'User already exists in this account',
          errorCode: 'user_already_exists'
        }))
      };
    }

    // Create deduplicated request with only new emails
    const deduplicatedRequest = { ...request, emails: newEmails };

    // Send invitations using the service
    const invitationResponse = await this.invitationService.sendInvitations(deduplicatedRequest);

    // Create user records based on invitation results
    const role = request.role || 'member';
    await this.createUserRecordsFromInvitations(invitationResponse, accountId, request.entityId, role);

    // Combine results: existing duplicates (failed) + new invitations (success/failed)
    const allResults = [
      // Add failed results for duplicate emails
      ...duplicateEmails.map(email => ({
        email,
        success: false,
        message: 'User already exists in this account',
        errorCode: 'user_already_exists'
      })),
      // Add results from new invitations
      ...invitationResponse.results
    ];

    // Calculate total statistics
    const totalSuccessful = invitationResponse.successful;
    const totalFailed = duplicateEmails.length + invitationResponse.failed;

    // Return response with all results
    return {
      totalProcessed: uniqueRequestEmails.length,
      successful: totalSuccessful,
      failed: totalFailed,
      results: allResults
    };
  }

  @PublicEndpointGuard()
  @Post('validate')
  async validateInvitation(@Body() request: ValidateInvitationRequest): Promise<ValidateInvitationResponse> {
    // Legacy endpoint - kept for backward compatibility
    return this.validateInvitationLegacy(request);
  }

  @PublicEndpointGuard()
  @Post('validate-token')
  async validateInvitationToken(@Body() request: ValidateInvitationTokenRequest): Promise<ValidateInvitationResponse> {
    try {
      this.logger.log('Validating invitation token');

      // Verify and decode the token
      const tokenPayload = this.tokenService.verifyInvitationToken(request.token);
      
      if (!tokenPayload) {
        this.logger.warn('Invalid or expired invitation token');
        return {
          isValid: false,
          error: 'Invalid or expired invitation link. Please request a new invitation.'
        };
      }

      // Find the user by email
      const user = await this.profileRepository.findUserByEmail(tokenPayload.email);
      
      if (!user) {
        this.logger.warn('Token validation for non-existent user', { 
          email: tokenPayload.email 
        });
        return {
          isValid: false,
          error: 'User not found. Please check your invitation link.'
        };
      }

      // Check if user status is pending (invitation was sent but not completed)
      if (user.status !== 'pending') {
        if (user.status === 'active') {
          return {
            isValid: false,
            error: 'This invitation has already been used. Please log in instead.'
          };
        } else {
          return {
            isValid: false,
            error: 'This invitation is no longer valid.'
          };
        }
      }

      // Additional security: Check if user already has a password
      if (user.hashedPassword) {
        this.logger.warn('Pending user already has password set', { 
          email: tokenPayload.email 
        });
        return {
          isValid: false,
          error: 'This account has already been activated. Please log in instead.'
        };
      }

      // Validate that the token parameters match the user record
      const roleMap: { [key: string]: number } = {
        '0': UserType.operator,
        '1': UserType.admin,
        '2': UserType.member,
        '3': UserType.viewer
      };
      
      const expectedUserType = roleMap[tokenPayload.role];
      if (user.userType !== expectedUserType) {
        this.logger.warn('Role mismatch during token validation', { 
          userRole: user.userType, 
          tokenRole: tokenPayload.role,
          email: tokenPayload.email 
        });
        return {
          isValid: false,
          error: 'Invalid invitation parameters.'
        };
      }

      // Get account and entity information
      const [account, entity, inviter] = await Promise.all([
        this.profileRepository.findAccountById(tokenPayload.accountId),
        tokenPayload.entityId ? this.profileRepository.findEntityById(tokenPayload.entityId) : null,
        this.profileRepository.findUserById(tokenPayload.inviterId)
      ]);

      if (!account) {
        this.logger.warn('Account not found during token validation', { 
          accountId: tokenPayload.accountId 
        });
        return {
          isValid: false,
          error: 'Invalid invitation parameters.'
        };
      }

      // Return successful validation with user and context information
      return {
        isValid: true,
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          status: user.status
        },
        account: {
          _id: account._id,
          company_name: account.company_name,
          account_type: account.account_type
        },
        entity: entity ? {
          _id: entity._id,
          name: entity.entity_name
        } : undefined,
        inviter: inviter ? {
          fullName: inviter.fullName
        } : undefined
      };

    } catch (error) {
      this.logger.error('Error validating invitation token', error);
      return {
        isValid: false,
        error: 'An error occurred while validating your invitation. Please try again.'
      };
    }
  }

  private async validateInvitationLegacy(@Body() request: ValidateInvitationRequest): Promise<ValidateInvitationResponse> {
    try {
      this.logger.log(`Validating invitation for email: ${request.email}`);

      // Normalize and validate email format
      const normalizedEmail = request.email.toLowerCase().trim();
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return {
          isValid: false,
          error: 'Invalid email format in invitation link.'
        };
      }

      // Find the user by email with exact match
      const user = await this.profileRepository.findUserByEmail(normalizedEmail);
      
      if (!user) {
        this.logger.warn('Validation attempt for non-existent user', InvitationController.name, { 
          email: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'User not found. Please check your invitation link.'
        };
      }

      // Ensure the email matches exactly (prevent email tampering)
      if (user.email.toLowerCase() !== normalizedEmail) {
        this.logger.warn('Email mismatch during validation', InvitationController.name, { 
          userEmail: user.email, 
          requestEmail: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'Email address does not match our records.'
        };
      }

      // Check if user status is pending (invitation was sent but not completed)
      if (user.status !== 'pending') {
        if (user.status === 'active') {
          return {
            isValid: false,
            error: 'This invitation has already been used. Please log in instead.'
          };
        } else {
          return {
            isValid: false,
            error: 'This invitation is no longer valid.'
          };
        }
      }

      // Additional security: Check if user already has a password (shouldn't happen for pending users)
      if (user.hashedPassword) {
        this.logger.warn('Pending user already has password set', InvitationController.name, { 
          email: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'This account has already been activated. Please log in instead.'
        };
      }

      // Validate that the invitation parameters match the user record
      const roleMap: { [key: string]: number } = {
        '0': UserType.operator,
        '1': UserType.admin,
        '2': UserType.member,
        '3': UserType.viewer
      };
      
      const expectedUserType = roleMap[request.role];
      if (user.userType !== expectedUserType) {
        this.logger.warn('Role mismatch during validation', InvitationController.name, { 
          userRole: user.userType, 
          requestRole: request.role,
          email: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'Invalid invitation parameters.'
        };
      }

      if (user.accountId !== request.accountId) {
        this.logger.warn('Account ID mismatch during validation', InvitationController.name, { 
          userAccountId: user.accountId, 
          requestAccountId: request.accountId,
          email: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'Invalid invitation parameters.'
        };
      }

      // For member/guest roles, validate entity ID
      if ((user.userType === UserType.member || user.userType === UserType.viewer) && user.entityId !== request.entityId) {
        this.logger.warn('Entity ID mismatch during validation', InvitationController.name, { 
          userEntityId: user.entityId, 
          requestEntityId: request.entityId,
          email: normalizedEmail 
        });
        return {
          isValid: false,
          error: 'Invalid invitation parameters.'
        };
      }

      // Get account information
      const account = await this.profileRepository.findAccountById(user.accountId);
      if (!account) {
        return {
          isValid: false,
          error: 'Associated account not found.'
        };
      }

      // Get entity information if applicable
      let entity = null;
      if (user.entityId) {
        entity = await this.profileRepository.findEntityById(user.entityId);
      }

      // Get inviter information (find an admin user in the same account)
      const accountUsers = await this.profileRepository.getUsersForAccount();
      const inviter = accountUsers.find(u => u.userType === UserType.admin && u.status === 'active');

      return {
        isValid: true,
        user: {
          _id: user._id!,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          status: user.status
        },
        account: {
          _id: account._id!,
          company_name: account.company_name || 'Unnamed Account',
          account_type: account.account_type
        },
        entity: entity ? {
          _id: entity._id!,
          name: entity.entity_name
        } : undefined,
        inviter: inviter ? {
          fullName: inviter.fullName
        } : undefined
      };

    } catch (error) {
      this.logger.error('Failed to validate invitation', error);
      return {
        isValid: false,
        error: 'Failed to validate invitation. Please try again or contact support.'
      };
    }
  }

  @PublicEndpointGuard()
  @Post('complete-signup')
  async completeSignup(@Body() request: CompleteSignupRequest): Promise<CompleteSignupResponse> {
    try {
      this.logger.log(`Completing signup for email: ${request.email}`);

      // Find the user by email (case-insensitive but exact match)
      const user = await this.profileRepository.findUserByEmail(request.email.toLowerCase().trim());
      
      if (!user) {
        this.logger.warn('Signup attempt for non-existent user', InvitationController.name, { 
          email: request.email 
        });
        throw new Error('Invalid invitation. User not found.');
      }

      // Ensure the email matches exactly (case-insensitive)
      if (user.email.toLowerCase() !== request.email.toLowerCase().trim()) {
        this.logger.warn('Email mismatch during signup', InvitationController.name, { 
          userEmail: user.email, 
          requestEmail: request.email 
        });
        throw new Error('Email address does not match the invitation.');
      }

      if (user.status !== 'pending') {
        this.logger.warn('Invalid signup attempt for non-pending user', InvitationController.name, { 
          email: request.email, 
          status: user.status 
        });
        
        if (user.status === 'active') {
          throw new Error('This invitation has already been used. Please log in instead.');
        } else {
          throw new Error('This invitation is no longer valid.');
        }
      }

      // Additional security: Check if user already has a password set
      if (user.hashedPassword) {
        this.logger.warn('Signup attempt for user who already has password', InvitationController.name, { 
          email: request.email 
        });
        throw new Error('This account has already been activated. Please log in instead.');
      }

      // Hash the password
      const hashedPassword = await this.passwordService.hashPassword(request.password);

      // Update user with new information and activate
      const updateSuccess = await this.profileRepository.updateUser(user._id!, {
        fullName: request.fullName,
        hashedPassword,
        phone: request.phone,
        profile_image_url: request.profile_image_url || user.profile_image_url,
        status: 'active',
        last_login: new Date()
      });

      if (!updateSuccess) {
        throw new Error('Failed to update user');
      }

      // Fetch the updated user data
      const updatedUser = await this.profileRepository.findUserById(user._id!);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      this.logger.log(`User signup completed successfully for: ${request.email}`);

      return {
        success: true,
        user: {
          _id: updatedUser._id!,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          userType: updatedUser.userType,
          accountId: updatedUser.accountId!,
          entityId: updatedUser.entityId,
          status: updatedUser.status
        },
        message: 'Account setup completed successfully!'
      };

    } catch (error) {
      this.logger.error('Failed to complete signup', error);
      throw error;
    }
  }

  private async createUserRecordsFromInvitations(
    invitationResponse: SendInvitationResponse,
    accountId: string,
    entityId: string | undefined,
    role: string = 'member'
  ): Promise<void> {
    try {
      // Map role string to UserType enum
      const roleMap: { [key: string]: number } = {
        'admin': UserType.admin,
        'member': UserType.member,
        'viewer': UserType.viewer
      };
      
      const userType = roleMap[role] || UserType.member;
      
      // Prepare user data for batch creation
      const usersData: CreateUserData[] = invitationResponse.results.map((result) => {
        const status = result.success ? 'pending' : 'failed to send request';
        
        return {
          fullName: result.email.split('@')[0],
          email: result.email,
          userType,
          accountId,
          entityId: entityId || undefined, // Handle undefined entityId for admin users
          status,
          profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User' // Placeholder profile picture
        };
      });

      // Create users in batch
      const createdUsers = await this.profileRepository.createUsersBatch(usersData);
      
      this.logger.log(`Batch created ${createdUsers.length} user records for invitations`);
      
      // Log individual user creation results
      usersData.forEach((userData, index) => {
        if (createdUsers[index]) {
          this.logger.log(`User record created for ${userData.email} with status: ${userData.status}`);
        }
      });

    } catch (error) {
      this.logger.error('Failed to create user records from invitations', error);
      
      // Fallback to individual creation if batch fails
      this.logger.log('Falling back to individual user creation...');
      await this.createUserRecordsIndividually(invitationResponse, accountId, entityId, role);
    }
  }

  private async createUserRecordsIndividually(
    invitationResponse: SendInvitationResponse,
    accountId: string,
    entityId: string | undefined,
    role: string = 'member'
  ): Promise<void> {
    // Map role string to UserType enum
    const roleMap: { [key: string]: number } = {
      'admin': UserType.admin,
      'member': UserType.member,
      'viewer': UserType.viewer
    };
    
    const userType = roleMap[role] || UserType.member;
    
    const userCreationPromises = invitationResponse.results.map(async (result) => {
      const userData: CreateUserData = {
        fullName: result.email.split('@')[0],
        email: result.email,
        userType,
        accountId,
        entityId: entityId || undefined, // Handle undefined entityId for admin users
        profile_image_url: 'https://via.placeholder.com/150x150/cccccc/ffffff?text=User' // Placeholder profile picture
      };

      const status = result.success ? 'pending' : 'failed to send request';
      
      try {
        await this.profileRepository.createUser({
          ...userData,
          status
        });
        
        this.logger.log(`User record created for ${result.email} with status: ${status}`);
      } catch (error) {
        this.logger.error(`Failed to create user record for ${result.email}`, error);
      }
    });

    await Promise.all(userCreationPromises);
  }
} 