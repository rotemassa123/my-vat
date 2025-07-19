import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { IGoogleOAuthService, GoogleUserInfo } from 'src/Common/ApplicationCore/Services/IGoogleOAuthService';
import { logger } from '../Config/Logger';

@Injectable()
export class GoogleOAuthService extends IGoogleOAuthService {
  private oauth2Client: OAuth2Client;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    super();
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI') || 'http://localhost:8000/api/auth/google/callback';
    
    if (!clientId || !clientSecret) {
      logger.error('Google OAuth configuration missing', 'GoogleOAuthService', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      throw new Error('Google OAuth configuration is incomplete. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    this.oauth2Client = new OAuth2Client(clientId, clientSecret, this.redirectUri);
  }

  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });

    logger.info('Generated Google OAuth URL', 'GoogleOAuthService');
    return authUrl;
  }

  async verifyAuthCode(code: string): Promise<GoogleUserInfo> {
    try {
      logger.info('Verifying Google OAuth authorization code', 'GoogleOAuthService');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      if (!tokens.id_token) {
        throw new Error('No ID token received from Google');
      }

      return await this.verifyIdToken(tokens.id_token);
    } catch (error) {
      logger.error('Failed to verify Google OAuth code', 'GoogleOAuthService', { 
        error: error.message 
      });
      throw new Error('Failed to verify Google authentication code');
    }
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      logger.info('Verifying Google ID token', 'GoogleOAuthService');
      
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google ID token payload');
      }

      const userInfo: GoogleUserInfo = {
        id: payload.sub!,
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture,
        verified_email: payload.email_verified || false,
      };

      logger.info('Successfully verified Google user', 'GoogleOAuthService', {
        email: userInfo.email,
        name: userInfo.name,
        verified: userInfo.verified_email,
      });

      return userInfo;
    } catch (error) {
      logger.error('Failed to verify Google ID token', 'GoogleOAuthService', { 
        error: error.message 
      });
      throw new Error('Failed to verify Google ID token');
    }
  }
} 