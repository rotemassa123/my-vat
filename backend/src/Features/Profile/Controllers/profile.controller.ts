import {
  Controller,
  Get,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ComprehensiveProfileResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserType } from "src/Common/consts/userType";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  constructor(private profileService: IProfileRepository) {}

  @Get()
  @UseGuards(AuthenticationGuard)
  async getProfile(@Req() request: any): Promise<ComprehensiveProfileResponse> {
    try {
      const user = request.user;
      const userType = user.userType;

      // Operator: No additional data to return
      if (userType === UserType.operator) {
        return {};
      }

      const account = await this.profileService.findAccountById(user.accountId);
      if (!account) {
        throw new NotFoundException('Account not found');
      }

      // Admin: Account + all entities + all users in account
      if (userType === UserType.admin) {
        const entities = await this.profileService.getEntitiesForAccount();
        const users = await this.profileService.getUsersForAccount();

        return {
          account: account,
          entities: entities,
          users: users,
        };
      }

      // Member/Guest: Account data + their specific entity
      if (userType === UserType.member || userType === UserType.viewer) {
        const entity = await this.profileService.findEntityById(user.entityId);
         if (!entity) {
          throw new NotFoundException('Entity not found');
        }

        return {
          account: account,
          entities: [entity],
        };
      }

      throw new BadRequestException('Invalid user type');
    } catch (error) {
      logger.error("Error fetching comprehensive profile", ProfileController.name, { 
        error: error.message, 
        userId: request.user?.userId 
      });
      throw error;
    }
  }
}
