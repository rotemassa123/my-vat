import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { IGmailService, EmailOptions } from '../../ApplicationCore/Services/IGmailService';

@Injectable()
export class GmailService extends IGmailService {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;
  private gmail: gmail_v1.Gmail;

  constructor(private readonly configService: ConfigService) {
    super();
    this.initializeGmailClient();
  }

  private initializeGmailClient(): void {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
      const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
      const refreshToken = this.configService.get<string>('GOOGLE_REFRESH_TOKEN');

      if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
        throw new Error('Missing required Google OAuth credentials in environment variables');
      }

      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      this.gmail = google.gmail({
        version: 'v1',
        auth: this.oauth2Client,
      });

      this.logger.log('Gmail client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Gmail client', error);
      throw error;
    }
  }

  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      const { to, subject, text, html, cc, bcc, attachments } = options;

      // Create email message
      const emailMessage = this.createEmailMessage({
        to,
        subject,
        text,
        html,
        cc,
        bcc,
        attachments,
      });

      // Send email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: emailMessage,
        },
      });

      const messageId = response.data.id;
      this.logger.log(`Email sent successfully with message ID: ${messageId}`);
      
      return messageId;
    } catch (error) {
      this.logger.error('Failed to send email', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private createEmailMessage(options: EmailOptions): string {
    const { to, subject, text, html, cc, bcc, attachments } = options;
    
    const boundary = `boundary_${Date.now()}`;
    let message = '';

    // Headers
    message += `To: ${to}\r\n`;
    if (cc) message += `Cc: ${cc}\r\n`;
    if (bcc) message += `Bcc: ${bcc}\r\n`;
    message += `Subject: ${subject}\r\n`;
    message += `MIME-Version: 1.0\r\n`;

    if (attachments && attachments.length > 0) {
      // Multipart message with attachments
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
      
      // Body part
      message += `--${boundary}\r\n`;
      if (html) {
        message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        message += `${html}\r\n`;
      } else {
        message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        message += `${text || ''}\r\n`;
      }

      // Attachment parts
      for (const attachment of attachments) {
        message += `--${boundary}\r\n`;
        message += `Content-Type: ${attachment.contentType || 'application/octet-stream'}\r\n`;
        message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        message += `Content-Transfer-Encoding: base64\r\n\r\n`;
        
        let content = '';
        if (attachment.content) {
          content = Buffer.isBuffer(attachment.content) 
            ? attachment.content.toString('base64')
            : Buffer.from(attachment.content).toString('base64');
        }
        message += `${content}\r\n`;
      }

      message += `--${boundary}--\r\n`;
    } else {
      // Simple message without attachments
      if (html) {
        message += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
        message += html;
      } else {
        message += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
        message += text || '';
      }
    }

    // Encode as base64url
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
} 