import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {
  CreateUserRequest,
  UpdateUserRequest,
} from "../Requests/user.requests";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { IUserRepository, CreateUserData, UpdateUserData } from "src/Common/ApplicationCore/Services/IUserRepository";
import {
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { UserType } from "src/Common/consts/userType";

interface UserResponse {
  userId: number;
  fullName: string;
  userType: UserType;
}

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(
    private userService: IUserRepository,
    private passwordService: PasswordService
  ) {}

  @Get()
  @ApiQuery({ name: "userId", required: false, type: Number })
  async getUsers(@Query("userId") userId?: string): Promise<UserResponse[]> {
    try {
      if (userId) {
        const user = await this.userService.findUserById(Number(userId));
        
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        return [{
          userId: user.userId,
          fullName: user.fullName,
          userType: user.userType,
        }];
      }

      // For now, return empty array since we don't have a findAll method
      // TODO: Add findAllUsers method to IUserRepository
      return [];
    } catch (error) {
      logger.error("Error fetching users", UserController.name, { error: error.message, userId });
      throw error;
    }
  }

  @Post()
  async createUser(@Body() createUserRequest: CreateUserRequest): Promise<UserResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userService.userExists(createUserRequest.userId);
      if (existingUser) {
        throw new BadRequestException(`User with ID ${createUserRequest.userId} already exists`);
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(createUserRequest.password);

      // Create user data
      const userData: CreateUserData = {
        userId: createUserRequest.userId,
        fullName: createUserRequest.fullName,
        email: createUserRequest.email,
        password: hashedPassword,
        userType: createUserRequest.userType,
        accountId: createUserRequest.accountId,
        status: 'active',
        permissions: ['view'],
      };

      const user = await this.userService.createUser(userData);

      return {
        userId: user.userId,
        fullName: user.fullName,
        userType: user.userType,
      };
    } catch (error) {
      logger.error("Error creating user", UserController.name, { error: error.message, userId: createUserRequest.userId });
      throw error;
    }
  }

  @Post(":userId")
  async updateUser(
    @Param("userId") userId: string,
    @Body() updateUserRequest: UpdateUserRequest
  ): Promise<UserResponse> {
    try {
      const userIdNum = Number(userId);
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userIdNum);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Prepare update data
      const updateData: UpdateUserData = {
        fullName: updateUserRequest.fullName,
        userType: updateUserRequest.userType,
      };

      // Hash password if provided
      if (updateUserRequest.password) {
        updateData.password = await this.passwordService.hashPassword(updateUserRequest.password);
      }

      const updated = await this.userService.updateUser(userIdNum, updateData);
      
      if (!updated) {
        throw new BadRequestException(`Failed to update user with ID ${userId}`);
      }

      // Return updated user data
      const updatedUser = await this.userService.findUserById(userIdNum);
      return {
        userId: updatedUser.userId,
        fullName: updatedUser.fullName,
        userType: updatedUser.userType,
      };
    } catch (error) {
      logger.error("Error updating user", UserController.name, { error: error.message, userId });
      throw error;
    }
  }

  @Delete(":userId")
  async deleteUser(@Param("userId") userId: string): Promise<{ success: boolean }> {
    try {
      const userIdNum = Number(userId);
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userIdNum);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const deleted = await this.userService.deleteUser(userIdNum);
      
      if (!deleted) {
        throw new BadRequestException(`Failed to delete user with ID ${userId}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting user", UserController.name, { error: error.message, userId });
      throw error;
    }
  }

}
