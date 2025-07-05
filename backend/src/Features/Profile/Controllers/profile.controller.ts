import {
  Controller,
  Get,
  Query,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiQuery } from "@nestjs/swagger";
import { CombinedProfileResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  constructor(private profileService: IProfileRepository) {}

  @Get("combined")
  @ApiQuery({ name: "userId", required: true, type: String, description: "User ID to get combined profile data for" })
  async getCombinedProfile(@Query("userId") userId: string): Promise<CombinedProfileResponse> {
    try {
      if (!userId) {
        throw new BadRequestException("'userId' query parameter is required");
      }

      // Get user data
      const user = await this.profileService.findUserById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Get account data using the user's accountId
      const account = await this.profileService.findAccountById(user.accountId);
      if (!account) {
        throw new NotFoundException(`Account with ID ${user.accountId} not found`);
      }

      // Get all entities for the account (tenant filter applied automatically)
      const entities = await this.profileService.getEntitiesForAccount();

      // Combine all data into a single response
      const combinedProfile: CombinedProfileResponse = {
        user: {
          _id: user._id!,
          fullName: user.fullName,
          email: user.email,
          userType: user.userType,
          accountId: user.accountId,
          status: user.status,
          last_login: user.last_login,
          profile_image_url: user.profile_image_url,
          phone: user.phone,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        account: {
          _id: account._id!,
          email: account.email,
          account_type: account.account_type,
          status: account.status,
          company_name: account.company_name,
          tax_id: account.tax_id,
          vat_number: account.vat_number,
          registration_number: account.registration_number,
          address: account.address,
          phone: account.phone,
          website: account.website,
          vat_settings: account.vat_settings,
          last_login: account.last_login,
          created_at: account.created_at,
          updated_at: account.updated_at,
        },
        entities: entities.map(entity => ({
          _id: entity._id!,
          accountId: entity.accountId,
          name: entity.name,
          entity_type: entity.entity_type,
          registration_number: entity.registration_number,
          incorporation_date: entity.incorporation_date,
          address: entity.address,
          phone: entity.phone,
          email: entity.email,
          vat_settings: entity.vat_settings,
          status: entity.status,
          description: entity.description,
          created_at: entity.created_at,
          updated_at: entity.updated_at,
        })),
      };

      logger.info("Combined profile data retrieved successfully", ProfileController.name, {
        userId,
        accountId: user.accountId,
        entitiesCount: entities.length,
      });

      return combinedProfile;
    } catch (error) {
      logger.error("Error fetching combined profile", ProfileController.name, {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}
