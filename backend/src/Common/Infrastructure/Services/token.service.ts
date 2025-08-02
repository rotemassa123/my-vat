import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface InvitationTokenPayload {
  email: string;
  accountId: string;
  entityId?: string;
  role: string;
  inviterId: string;
  expiresAt: number;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Generate a secure invitation token
   */
  generateInvitationToken(
    email: string,
    accountId: string,
    entityId: string | undefined,
    role: string,
    inviterId: string
  ): string {
    const payload: InvitationTokenPayload = {
      email: email.toLowerCase().trim(),
      accountId,
      entityId,
      role,
      inviterId,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days from now
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      this.logger.error('JWT_SECRET environment variable is not set');
      throw new Error('JWT_SECRET environment variable is not configured');
    }

    this.logger.log('Generating invitation token', { email, accountId, role, inviterId });

    return this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '7d'
    });
  }

  /**
   * Verify and decode an invitation token
   */
  verifyInvitationToken(token: string): InvitationTokenPayload | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      }) as InvitationTokenPayload;

      // Additional validation
      if (!payload.email || !payload.accountId || !payload.role || !payload.inviterId) {
        this.logger.warn('Invalid token payload structure', { token: token.substring(0, 20) + '...' });
        return null;
      }

      // Check if token has expired
      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        this.logger.warn('Token has expired', { email: payload.email });
        return null;
      }

      return payload;
    } catch (error) {
      this.logger.warn('Failed to verify invitation token', { error: error.message });
      return null;
    }
  }

  /**
   * Extract token from URL parameter
   */
  extractTokenFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('token');
    } catch (error) {
      this.logger.warn('Failed to extract token from URL', { url, error: error.message });
      return null;
    }
  }
} 