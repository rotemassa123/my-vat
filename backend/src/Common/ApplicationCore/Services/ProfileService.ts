import { Injectable } from "@nestjs/common";
import { IProfileRepository, UserData } from "./IProfileRepository";

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async getUserById(userId: string): Promise<UserData | null> {
    return await this.profileRepository.findUserById(userId);
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<boolean> {
    return await this.profileRepository.updateUser(userId, {
      profile_image_url: profileImageUrl
    });
  }

  async deleteUserProfileImage(userId: string): Promise<boolean> {
    return await this.profileRepository.updateUser(userId, {
      profile_image_url: null
    });
  }
}
