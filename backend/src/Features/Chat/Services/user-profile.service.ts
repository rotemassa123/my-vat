import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  vatNumber?: string;
  defaultCurrency?: string;
  defaultVatRate?: string;
}

@Injectable()
export class UserProfileService {
  constructor(private configService: ConfigService) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    // TODO: Replace with actual user service call
    // For now, return mock data
    return {
      userId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      companyName: 'Acme Corp',
      vatNumber: 'GB123456789',
      defaultCurrency: 'GBP',
      defaultVatRate: '20%',
    };
  }

  async updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile> {
    // TODO: Implement actual user profile update
    const currentProfile = await this.getUserProfile(userId);
    return { ...currentProfile, ...profile };
  }
}
