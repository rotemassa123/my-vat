import { Injectable, NotFoundException } from '@nestjs/common';
import { IProfileRepository } from '../../../Common/ApplicationCore/Services/IProfileRepository';

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
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    // Get user data - check if userId is an email or ObjectId
    let user;
    
    if (this.isEmail(userId)) {
      // If it looks like an email, find by email
      user = await this.profileRepository.findUserByEmail(userId);
    } else {
      // Otherwise, treat it as an ObjectId
      user = await this.profileRepository.findUserById(userId);
    }
    
    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    // Parse full name into first and last name
    const nameParts = user.fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Get account data if available
    let companyName: string | undefined;
    let vatNumber: string | undefined;
    let defaultCurrency: string | undefined;
    let defaultVatRate: string | undefined;

    if (user.accountId) {
      const account = await this.profileRepository.findAccountById(user.accountId);
      if (account) {
        companyName = account.company_name;
        vatNumber = account.vat_number;
        defaultCurrency = account.vat_settings?.default_currency;
        defaultVatRate = account.vat_settings?.vat_rate
          ? `${account.vat_settings.vat_rate}%`
          : undefined;
      }
    }

    return {
      userId: user._id,
      firstName,
      lastName,
      email: user.email,
      companyName,
      vatNumber,
      defaultCurrency,
      defaultVatRate,
    };
  }

  /**
   * Check if a string looks like an email address
   */
  private isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }
}
