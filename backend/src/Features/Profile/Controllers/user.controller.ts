import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiQuery, ApiParam } from "@nestjs/swagger";
import { CreateUserRequest, UpdateUserRequest } from "../Requests/profile.requests";
import { UserResponse, CreateUserResponse } from "../Responses/profile.responses";
import { IProfileRepository, CreateUserData, UpdateUserData } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(
    private userService: IProfileRepository,
    private passwordService: PasswordService
  ) {}

  @Get()
  @ApiQuery({ name: "userId", required: false, type: String })
  async getUsers(@Query("userId") userId?: string): Promise<UserResponse[]> {
    try {
      if (userId) {
        const user = await this.userService.findUserById(userId);
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        return [user as UserResponse];
      }

      throw new BadRequestException("'userId' query parameter is required");
    } catch (error) {
      logger.error("Error fetching users", UserController.name, { error: error.message, userId });
      throw error;
    }
  }

  @Get(":id")
  @ApiParam({ name: "id", type: String })
  async getUserById(@Param("id") id: string): Promise<UserResponse> {
    try {
      const user = await this.userService.findUserById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user as UserResponse;
    } catch (error) {
      logger.error("Error fetching user by ID", UserController.name, { error: error.message, id });
      throw error;
    }
  }

  @Post()
  async createUser(@Body() createUserRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // Check if user already exists by email
      const existingUser = await this.userService.userExistsByEmail(createUserRequest.email);
      if (existingUser) {
        throw new BadRequestException(`User with email ${createUserRequest.email} already exists`);
      }

      // Validate that the account exists
      const accountExists = await this.userService.accountExists(createUserRequest.accountId.toString());
      if (!accountExists) {
        throw new BadRequestException(`Account with ID ${createUserRequest.accountId} does not exist`);
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(createUserRequest.password);

      const userData: CreateUserData = {
        fullName: createUserRequest.fullName,
        email: createUserRequest.email,
        hashedPassword: hashedPassword,
        userType: createUserRequest.userType,
        accountId: createUserRequest.accountId,
        phone: createUserRequest.phone,
        profile_image_url: createUserRequest.profile_image_url,
      };

      const user = await this.userService.createUser(userData);
      if (!user._id) {
        throw new BadRequestException('Failed to create user - no ID returned');
      }
      return { _id: user._id };
    } catch (error) {
      logger.error("Error creating user", UserController.name, { 
        error: error.message, 
        email: createUserRequest.email 
      });
      throw error;
    }
  }

  @Put(":id")
  @ApiParam({ name: "id", type: String })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserRequest: UpdateUserRequest
  ): Promise<UserResponse> {
    try {
      // Check if user exists
      const existingUser = await this.userService.findUserById(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const updateData: UpdateUserData = {
        fullName: updateUserRequest.fullName,
        email: updateUserRequest.email,
        userType: updateUserRequest.userType,
        status: updateUserRequest.status,
        phone: updateUserRequest.phone,
        profile_image_url: updateUserRequest.profile_image_url,
      };

      // Hash password if provided
      if (updateUserRequest.password) {
        updateData.hashedPassword = await this.passwordService.hashPassword(updateUserRequest.password);
      }

      const updated = await this.userService.updateUser(id, updateData);
      if (!updated) {
        throw new BadRequestException(`Failed to update user with ID ${id}`);
      }

      const updatedUser = await this.userService.findUserById(id);
      return updatedUser as UserResponse;
    } catch (error) {
      logger.error("Error updating user", UserController.name, { error: error.message, id });
      throw error;
    }
  }

  @Delete(":id")
  @ApiParam({ name: "id", type: String })
  async deleteUser(@Param("id") id: string): Promise<{ success: boolean }> {
    try {
      // Check if user exists
      const existingUser = await this.userService.findUserById(id);
      if (!existingUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      const deleted = await this.userService.deleteUser(id);
      if (!deleted) {
        throw new BadRequestException(`Failed to delete user with ID ${id}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting user", UserController.name, { error: error.message, id });
      throw error;
    }
  }
}
