export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

export abstract class IGmailService {
  abstract sendEmail(options: EmailOptions): Promise<string>;
} 