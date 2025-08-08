import {
  Controller,
  Get,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Req,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ComprehensiveProfileResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserType } from "src/Common/consts/userType";
import { IImageStorageProvider } from "src/Common/ApplicationCore/Providers/IImageStorageProvider";
import { CurrentAccountId } from "src/Common/decorators/current-account-id.decorator";
import { CurrentUserId } from "src/Common/decorators/current-user-id.decorator";
import * as path from "path";

@ApiTags("profile")
@Controller("profile")
export class ProfileController {
  constructor(
    private profileService: IProfileRepository,
    private readonly imageStorage: IImageStorageProvider,
  ) {}

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

  // Upload profile image (Cloudinary)
  @Post('upload-image')
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload user profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Profile image uploaded successfully' })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() userId: string,
  ): Promise<{ profileImageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate user exists
    const user = await this.profileService.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // If user already has an image (and not default), delete it from storage
    if (user.profile_image_url && !user.profile_image_url.endsWith('avatar.jpg')) {
      await this.imageStorage.Delete(user.profile_image_url);
    }

    // Upload the new image
    const { name } = path.parse(file.originalname);
    const imagePath = `profileImages/${userId}/${name}`;
    await this.imageStorage.UploadFile(imagePath, file.buffer);
    const profileImageUrl = this.imageStorage.getPublicUrl(imagePath);

    // Update user record with new image URL
    await this.profileService.updateUser(userId, { profile_image_url: profileImageUrl });

    return { profileImageUrl };
  }

  // Delete profile image
  @Delete('delete-image')
  @UseGuards(AuthenticationGuard)
  async deleteProfileImage(
    @CurrentUserId() userId: string,
  ): Promise<{ success: boolean }> {
    const user = await this.profileService.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.profile_image_url) {
      // Nothing to delete; make the field null
      await this.profileService.updateUser(userId, { profile_image_url: null });
      return { success: true };
    }

    await this.imageStorage.Delete(user.profile_image_url);
    await this.profileService.updateUser(userId, { profile_image_url: null });

    return { success: true };
  }
}
