import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IGmailService, BatchEmailOptions, BatchEmailResult } from 'src/Common/ApplicationCore/Services/IGmailService';
import { IProfileRepository } from 'src/Common/ApplicationCore/Services/IProfileRepository';
import { UserType } from 'src/Common/consts/userType';
import { SendInvitationRequest, InvitationResult, SendInvitationResponse } from '../Requests/invitation.requests';
import { TokenService } from 'src/Common/Infrastructure/Services/token.service';
import * as httpContext from 'express-http-context';
import { UserContext } from 'src/Common/Infrastructure/types/user-context.type';

interface InvitationEmailData {
  email: string;
  inviterName: string;
  accountName: string;
  entityName?: string;
  personalMessage?: string;
  inviteUrl: string;
}

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    private readonly gmailService: IGmailService,
    private readonly profileRepository: IProfileRepository,
    private readonly tokenService: TokenService
  ) {}

  async sendInvitations(request: SendInvitationRequest): Promise<SendInvitationResponse> {
    try {
      // Get context information
      const userContext = httpContext.get('user_context') as UserContext | undefined;
      const accountId = userContext?.accountId;
      const userId = userContext?.userId;

      if (!accountId || !userId) {
        throw new BadRequestException('Missing account or user context');
      }

      // Validate request requirements
      await this.validateRequestRequirements(request);

      // Get account and user information
      const [account, inviter] = await Promise.all([
        this.profileRepository.findAccountById(accountId),
        this.profileRepository.findUserById(userId)
      ]);

      if (!account || !inviter) {
        throw new BadRequestException('Account or user not found');
      }

      // Get entity information (required for member invitations, optional for admin)
      let entity = null;
      if (request.entityId) {
        entity = await this.profileRepository.findEntityById(request.entityId);
        if (!entity) {
          throw new BadRequestException('Entity not found');
        }
      }

      // Process invitations using batch emails
      const invitationResults = await this.processInvitationsBatch(request, account, inviter, entity);

      // Calculate statistics
      const successful = invitationResults.filter(r => r.success).length;
      const failed = invitationResults.filter(r => !r.success).length;

      this.logger.log(`Invitation batch completed: ${successful} successful, ${failed} failed`);

      return {
        totalProcessed: request.emails.length,
        successful,
        failed,
        results: invitationResults
      };

    } catch (error) {
      this.logger.error('Failed to send invitations', error);
      throw error;
    }
  }

  private async validateRequestRequirements(request: SendInvitationRequest): Promise<void> {
    const role = request.role || 'member';
    
    // Entity ID is required for member/viewer roles, optional for admin
    if (role !== 'admin' && !request.entityId) {
      throw new BadRequestException('Entity ID is required when inviting members or viewers');
    }
  }

  private async processInvitationsBatch(
    request: SendInvitationRequest,
    account: any,
    inviter: any,
    entity: any
  ): Promise<InvitationResult[]> {
    try {
      const role = request.role || 'member';
      
      // Prepare batch emails for all users (no existing user checks)
      const batchEmails: BatchEmailOptions[] = request.emails.map((email, index) => {
        const emailData: InvitationEmailData = {
          email,
          inviterName: inviter.full_name || inviter.email.split('@')[0], // Use full_name from UserData
          accountName: account.company_name,
          entityName: entity?.entity_name,
          personalMessage: request.personalMessage,
          inviteUrl: this.generateInviteUrl(email, account._id, inviter._id, entity?._id, role)
        };

        return {
          to: email,
          subject: `Invitation to join ${account.company_name} on MyVAT`,
          html: this.generateInvitationEmailHtml(emailData, role),
          text: this.generateInvitationEmailText(emailData, role),
          batchId: `invitation_${index}_${Date.now()}`
        };
      });

      // Send batch emails
      this.logger.log(`Sending batch of ${batchEmails.length} invitation emails`);
      const batchResults = await this.gmailService.sendBatchEmails(batchEmails);

      // Map batch results to invitation results
      const invitationResults: InvitationResult[] = batchResults.map(result => ({
        email: result.email,
        success: result.success,
        message: result.success ? 'Invitation sent successfully' : result.error || 'Failed to send invitation',
        errorCode: result.success ? undefined : 'send_failed',
        messageId: result.messageId
      }));

      return invitationResults;

    } catch (error) {
      this.logger.error('Failed to process invitations batch', error);
      
      // Return failed results for all emails
      return request.emails.map(email => ({
        email,
        success: false,
        message: error.message || 'Failed to send invitation',
        errorCode: 'send_failed'
      }));
    }
  }

  private async sendInvitationEmail(data: InvitationEmailData): Promise<void> {
    const subject = `Invitation to join ${data.accountName} on MyVAT`;
    const htmlContent = this.generateInvitationEmailHtml(data);
    const textContent = this.generateInvitationEmailText(data);

    await this.gmailService.sendEmail({
      to: data.email,
      subject,
      html: htmlContent,
      text: textContent
    });
  }

  private generateInvitationEmailHtml(data: InvitationEmailData, role: string = 'member'): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>You're invited to join ${data.accountName}</h2>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>${data.inviterName} has invited you to join <strong>${data.accountName}</strong> on MyVAT as a <strong>${role.charAt(0).toUpperCase() + role.slice(1)}</strong>${data.entityName ? ` for ${data.entityName}` : ''}.</p>
              
              ${data.personalMessage ? `
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <h4>Personal message from ${data.inviterName}:</h4>
                  <p><em>${data.personalMessage}</em></p>
                </div>
              ` : ''}
              
              <p>Click the button below to accept the invitation and set up your account:</p>
              
              <a href="${data.inviteUrl}" class="button" style="color: white;">Accept Invitation</a>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p><a href="${data.inviteUrl}">${data.inviteUrl}</a></p>
              
              <p>This invitation will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>This invitation was sent by ${data.inviterName} from ${data.accountName}.</p>
              <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateInvitationEmailText(data: InvitationEmailData, role: string = 'member'): string {
    return `
You're invited to join ${data.accountName}

Hello!

${data.inviterName} has invited you to join ${data.accountName} on MyVAT as a ${role.charAt(0).toUpperCase() + role.slice(1)}${data.entityName ? ` for ${data.entityName}` : ''}.

${data.personalMessage ? `
Personal message from ${data.inviterName}:
${data.personalMessage}
` : ''}

To accept the invitation and set up your account, visit:
${data.inviteUrl}

This invitation will expire in 7 days.

---
This invitation was sent by ${data.inviterName} from ${data.accountName}.
If you weren't expecting this invitation, you can safely ignore this email.
    `;
  }

  private generateInviteUrl(email: string, accountId: string, inviterId: string, entityId?: string, role: string = 'member'): string {
    // TODO: Replace with actual frontend URL from config
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Map role string to UserType enum
    const roleMap: { [key: string]: number } = {
      'admin': UserType.admin,
      'member': UserType.member,
      'viewer': UserType.viewer
    };
    
    const userType = roleMap[role] || UserType.member;
    
    // Generate secure token instead of exposing sensitive data in URL
    this.logger.log('Generating secure invitation token', { email, accountId, entityId, role: userType.toString(), inviterId });
    
    const token = this.tokenService.generateInvitationToken(
      email,
      accountId,
      entityId,
      userType.toString(),
      inviterId
    );
    
    const secureUrl = `${baseUrl}/accept-invitation?token=${encodeURIComponent(token)}`;
    this.logger.log('Generated secure invitation URL', { email, secureUrl: secureUrl.substring(0, 50) + '...' });
    
    return secureUrl;
  }
} 