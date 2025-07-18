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
    // Remove duplicate emails (case-insensitive)
    const uniqueEmails = [...new Set(request.emails.map(email => email.toLowerCase()))];
    const deduplicatedRequest = { ...request, emails: uniqueEmails };

    // Send invitations using the service
    const invitationResponse = await this.invitationService.sendInvitations(deduplicatedRequest);

    // Get context information for user creation
    const accountId = httpContext.get('account_id') as string;

    // Create user records based on invitation results
    await this.createUserRecordsFromInvitations(invitationResponse, accountId, request.entityId);

    // Return response with deduplicated count
    return {
      ...invitationResponse,
      totalProcessed: uniqueEmails.length,
    };
  }

  private async createUserRecordsFromInvitations(
    invitationResponse: SendInvitationResponse,
    accountId: string,
    entityId: string
  ): Promise<void> {
    try {
      // Prepare user data for batch creation
      const usersData: CreateUserData[] = invitationResponse.results.map((result) => {
        const status = result.success ? 'pending' : 'failed to send request';
        
        return {
          fullName: result.email.split('@')[0],
          email: result.email,
          userType: UserType.member,
          accountId,
          entityId,
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
      await this.createUserRecordsIndividually(invitationResponse, accountId, entityId);
    }
  }

  private async createUserRecordsIndividually(
    invitationResponse: SendInvitationResponse,
    accountId: string,
    entityId: string
  ): Promise<void> {
    const userCreationPromises = invitationResponse.results.map(async (result) => {
      const userData: CreateUserData = {
        fullName: result.email.split('@')[0],
        email: result.email,
        userType: UserType.member,
        accountId,
        entityId,
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