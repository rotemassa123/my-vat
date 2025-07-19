export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

export abstract class IGoogleOAuthService {
  abstract getAuthUrl(): string;
  abstract verifyAuthCode(code: string): Promise<GoogleUserInfo>;
  abstract verifyIdToken(idToken: string): Promise<GoogleUserInfo>;
} 