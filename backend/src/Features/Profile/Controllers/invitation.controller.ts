import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { InvitationService } from '../Services/invitation.service';
import { SendInvitationRequest, SendInvitationResponse } from '../Requests/invitation.requests';
import { RequireRoles } from 'src/Common/Infrastructure/decorators/require-roles.decorator';
import { UserType } from 'src/Common/consts/userType';
import { IProfileRepository, CreateUserData } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import * as httpContext from 'express-http-context';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationController {
  private readonly logger = new Logger(InvitationController.name);

  constructor(
    private readonly invitationService: InvitationService,
    private readonly profileRepository: IProfileRepository
  ) {}

  @RequireRoles(UserType.admin, UserType.operator)
  @Post('send')
  async sendInvitations(@Body() request: SendInvitationRequest): Promise<SendInvitationResponse> {
    // Get context information for user creation
    const accountId = httpContext.get('account_id') as string;

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
        'viewer': UserType.guest
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
      'viewer': UserType.guest
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