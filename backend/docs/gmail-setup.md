# Gmail Service Setup

This document explains how to set up the Gmail service in the VAT processing backend.

## Prerequisites

1. A Google Cloud Project with Gmail API enabled
2. OAuth 2.0 credentials configured
3. A refresh token for server-side authentication

## Step 1: Enable Gmail API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Gmail API" and enable it

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application" as the application type
4. Set the redirect URI to: `http://localhost:8000/api/v1/auth/google/callback`
5. Download the credentials JSON file

## Step 3: Generate Refresh Token

You'll need to generate a refresh token for server-side authentication. Here's a sample script:

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

const scopes = ['https://www.googleapis.com/auth/gmail.send'];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent'
});

console.log('Visit this URL to authorize the application:', url);

// After getting the authorization code from the URL:
// oauth2Client.getToken(authorizationCode).then(({ tokens }) => {
//   console.log('Refresh token:', tokens.refresh_token);
// });
```

## Step 4: Environment Variables

Add these environment variables to your `.env` file:

```bash
# Gmail API Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
GOOGLE_REFRESH_TOKEN=your-google-refresh-token
```

## Step 5: Usage

The Gmail service is automatically injected into your application. You can use it in any controller or service:

```typescript
import { IGmailService } from 'src/Common/ApplicationCore/Services/IGmailService';

@Controller('example')
export class ExampleController {
  constructor(private readonly gmailService: IGmailService) {}

  @Post('send-notification')
  async sendNotification() {
    const messageId = await this.gmailService.sendEmail({
      to: 'user@example.com',
      subject: 'VAT Processing Complete',
      html: '<h1>Your VAT processing is complete!</h1>',
      text: 'Your VAT processing is complete!'
    });
    
    return { messageId };
  }
}
```

## API Endpoint

The service includes a REST endpoint for sending emails:

```bash
POST /api/v1/email/send
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "text": "This is a test email",
  "html": "<h1>This is a test email</h1>",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com"
}
```

## Features

- Send plain text and HTML emails
- Support for CC and BCC recipients
- File attachments support
- Automatic OAuth token refresh
- Comprehensive error handling and logging
- TypeScript support with proper interfaces

## Security Notes

- Never commit your credentials to version control
- Use environment variables for all sensitive configuration
- The refresh token allows long-term access, store it securely
- Consider implementing rate limiting for the email endpoint
- Gmail has sending limits: 2,000 messages per day, 10,000 recipients per day

## Troubleshooting

1. **"Missing required Google OAuth credentials"**: Ensure all environment variables are set
2. **"Failed to send email"**: Check your Gmail API quotas and permissions
3. **"Invalid refresh token"**: Regenerate the refresh token following Step 3
4. **"Access denied"**: Verify the Gmail API is enabled and scopes are correct 