import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { IGmailService, EmailOptions } from '../../ApplicationCore/Services/IGmailService';
import * as https from 'https';

interface BatchEmailOptions extends EmailOptions {
  batchId?: string;
}

interface BatchEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  email: string;
}

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

  /**
   * Send multiple emails using Gmail API batch requests
   * @param emailOptions Array of email options (max 50 emails per batch)
   * @returns Array of results for each email
   */
  async sendBatchEmails(emailOptions: BatchEmailOptions[]): Promise<BatchEmailResult[]> {
    try {
      if (emailOptions.length === 0) {
        return [];
      }

      if (emailOptions.length > 50) {
        throw new Error('Maximum 50 emails allowed per batch request');
      }

      this.logger.log(`Sending batch of ${emailOptions.length} emails`);

      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Create batch request
      const batchRequest = await this.createBatchRequest(emailOptions, accessToken);
      
      // Send batch request
      const response = await this.sendBatchRequest(batchRequest, accessToken);
      
      // Parse batch response
      const results = this.parseBatchResponse(response, emailOptions);
      
      this.logger.log(`Batch email sending completed. Success: ${results.filter(r => r.success).length}, Failed: ${results.filter(r => !r.success).length}`);
      
      return results;
    } catch (error) {
      this.logger.error('Failed to send batch emails', error);
      throw new Error(`Failed to send batch emails: ${error.message}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const { token } = await this.oauth2Client.getAccessToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }
      return token;
    } catch (error) {
      this.logger.error('Failed to get access token', error);
      throw error;
    }
  }

  private async createBatchRequest(emailOptions: BatchEmailOptions[], accessToken: string): Promise<string> {
    const boundary = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let batchBody = '';

    for (let i = 0; i < emailOptions.length; i++) {
      const options = emailOptions[i];
      const batchId = options.batchId || `email_${i}`;
      
      // Create individual email message
      const emailMessage = this.createEmailMessage(options);
      
      // Create batch part
      batchBody += `--${boundary}\r\n`;
      batchBody += `Content-Type: application/http\r\n`;
      batchBody += `Content-ID: <${batchId}>\r\n\r\n`;
      batchBody += `POST /gmail/v1/users/me/messages/send\r\n`;
      batchBody += `Content-Type: application/json\r\n\r\n`;
      batchBody += JSON.stringify({ raw: emailMessage }) + '\r\n';
    }

    batchBody += `--${boundary}--\r\n`;

    return batchBody;
  }

  private async sendBatchRequest(batchBody: string, accessToken: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const boundary = batchBody.match(/--([^\r\n]+)/)?.[1];
      
      const options = {
        hostname: 'www.googleapis.com',
        port: 443,
        path: '/batch/gmail/v1',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/mixed; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(batchBody),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Batch request failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(batchBody);
      req.end();
    });
  }

  private parseBatchResponse(response: string, emailOptions: BatchEmailOptions[]): BatchEmailResult[] {
    const results: BatchEmailResult[] = [];
    
    try {
      // Split the response by boundary
      const parts = response.split(/--[^\r\n]+\r?\n/);
      
      for (let i = 0; i < emailOptions.length; i++) {
        const email = emailOptions[i].to;
        
        // Find the corresponding response part
        const responsePart = parts.find(part => 
          part.includes(`Content-ID: <response-${emailOptions[i].batchId || `email_${i}`}>`) ||
          part.includes(`Content-ID: <${emailOptions[i].batchId || `email_${i}`}>`)
        );
        
        if (responsePart) {
          // Extract HTTP status and response body
          const statusMatch = responsePart.match(/HTTP\/1\.1 (\d+)/);
          const status = statusMatch ? parseInt(statusMatch[1]) : 500;
          
          if (status >= 200 && status < 300) {
            // Try to extract message ID from response
            const messageIdMatch = responsePart.match(/"id":\s*"([^"]+)"/);
            const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
            
            results.push({
              success: true,
              messageId,
              email,
            });
          } else {
            // Extract error message
            const errorMatch = responsePart.match(/"message":\s*"([^"]+)"/);
            const errorMessage = errorMatch ? errorMatch[1] : `HTTP ${status}`;
            
            results.push({
              success: false,
              error: errorMessage,
              email,
            });
          }
        } else {
          results.push({
            success: false,
            error: 'No response found for this email',
            email,
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to parse batch response', error);
      
      // Return failed results for all emails
      return emailOptions.map(options => ({
        success: false,
        error: 'Failed to parse batch response',
        email: options.to,
      }));
    }
    
    return results;
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