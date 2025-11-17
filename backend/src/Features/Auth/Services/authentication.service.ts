import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

export interface ImpersonationTokenPayload {
  sub: string;
  scope: string;
  operatorId?: string;
}

@Injectable()
export class AuthenticationService {
  private readonly impersonationTokenScope = 'impersonation';
  private readonly impersonationTokenExpirySeconds = 60 * 60;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  getImpersonationExpirySeconds(): number {
    return this.impersonationTokenExpirySeconds;
  }

  getFrontendBaseUrl(): string {
    return (
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'
    ).replace(/\/$/, '');
  }

  getBackendBaseUrl(): string {
    return (
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:8000/api'
    ).replace(/\/$/, '');
  }

  setAuthCookie(response: Response, token: string): void {
    response.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  async createImpersonationToken(
    userId: string,
    operatorId?: string,
  ): Promise<{ token: string; expiresAt: Date; impersonationUrl: string }> {
    const expiresAt = new Date(
      Date.now() + this.impersonationTokenExpirySeconds * 1000,
    );

    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        scope: this.impersonationTokenScope,
        operatorId,
      },
      {
        secret: this.getImpersonationSecret(),
        expiresIn: this.impersonationTokenExpirySeconds,
      },
    );

    const impersonationUrl = `${this.getBackendBaseUrl()}/auth/magic-link/${token}`;

    return { token, expiresAt, impersonationUrl };
  }

  async verifyImpersonationToken(token: string): Promise<ImpersonationTokenPayload> {
    const payload = await this.jwtService.verifyAsync<ImpersonationTokenPayload>(token, {
      secret: this.getImpersonationSecret(),
    });

    if (payload.scope !== this.impersonationTokenScope) {
      throw new UnauthorizedException('Invalid impersonation token scope');
    }

    return payload;
  }

  private getImpersonationSecret(): string {
    return (
      this.configService.get<string>('IMPERSONATION_JWT_SECRET') ||
      this.configService.get<string>('JWT_SECRET')
    );
  }
}

