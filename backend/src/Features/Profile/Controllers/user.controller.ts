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
import { PublicEndpointGuard } from "src/Common/Infrastructure/decorators/publicEndpoint.decorator";
import { UserType } from "src/Common/consts/userType";
import { RequireRoles } from "src/Common/Infrastructure/decorators/require-roles.decorator";

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
      if (!userId) {
        throw new BadRequestException("'userId' query parameter is required");
      }

      const user = await this.userService.findUserById(userId);
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
        
        return [user as UserResponse];      
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

  @PublicEndpointGuard()
  @Post()
  async createUser(@Body() createUserRequest: CreateUserRequest): Promise<CreateUserResponse> {
    try {
      // Check if user already exists by email
      const existingUser = await this.userService.userExistsByEmail(createUserRequest.email);
      if (existingUser) {
        throw new BadRequestException(`User with email ${createUserRequest.email} already exists`);
      }

      // Validate user type specific requirements
      if (createUserRequest.userType === UserType.operator) {
        // Operator: should not have account_id or entity_id
        if (createUserRequest.accountId) {
          throw new BadRequestException('Operator user should not have account_id');
        }
        if (createUserRequest.entityId) {
          throw new BadRequestException('Operator user should not have entity_id');
        }
      } else if (createUserRequest.userType === UserType.admin) {
        // Admin: must have account_id, must NOT have entity_id
        if (!createUserRequest.accountId) {
          throw new BadRequestException('Admin user must have account_id');
        }
        if (createUserRequest.entityId) {
          throw new BadRequestException('Admin user must not have entity_id');
        }
      } else if (createUserRequest.userType === UserType.member || createUserRequest.userType === UserType.guest) {
        // Member/Guest: must have both account_id and entity_id
        if (!createUserRequest.accountId) {
          throw new BadRequestException('Member/Guest user must have account_id');
        }
        if (!createUserRequest.entityId) {
          throw new BadRequestException('Member/Guest user must have entity_id');
        }
      }

      // Validate that the account exists if accountId is provided
      if (createUserRequest.accountId) {
        const accountExists = await this.userService.accountExists(createUserRequest.accountId);
        if (!accountExists) {
          throw new BadRequestException(`Account with ID ${createUserRequest.accountId} does not exist`);
        }
      }

      // Validate that the entity exists if entityId is provided
      if (createUserRequest.entityId) {
        const entityExists = await this.userService.entityExists(createUserRequest.entityId);
        if (!entityExists) {
          throw new BadRequestException(`Entity with ID ${createUserRequest.entityId} does not exist`);
        }
      }

      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(createUserRequest.password);

      const userData: CreateUserData = {
        fullName: createUserRequest.fullName,
        email: createUserRequest.email,
        hashedPassword: hashedPassword,
        userType: createUserRequest.userType,
        accountId: createUserRequest.accountId,
        entityId: createUserRequest.entityId,
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

      // Prevent users from becoming operators
      if (updateUserRequest.userType === UserType.operator) {
        throw new BadRequestException("Users cannot become operators");
      }

      const updateData: UpdateUserData = {
        fullName: updateUserRequest.fullName,
        email: updateUserRequest.email,
        userType: updateUserRequest.userType,
        accountId: updateUserRequest.accountId,
        entityId: updateUserRequest.entityId,
        status: updateUserRequest.status,
        phone: updateUserRequest.phone,
        profile_image_url: updateUserRequest.profile_image_url,
      };

      // Handle user type changes
      if (updateUserRequest.userType !== undefined) {
        // If user is being set to admin, remove entity_id
        if (updateUserRequest.userType === UserType.admin) {
          updateData.entityId = undefined;
        }
        
        // If user is being set to member/guest after being admin, ensure they have an entity
        if ((updateUserRequest.userType === UserType.member || updateUserRequest.userType === UserType.guest) &&
            existingUser.userType === UserType.admin) {
          if (!updateUserRequest.entityId) {
            throw new BadRequestException("Member/Guest users must have an entity_id");
          }
          
          // Validate that the entity exists
          const entityExists = await this.userService.entityExists(updateUserRequest.entityId);
          if (!entityExists) {
            throw new BadRequestException(`Entity with ID ${updateUserRequest.entityId} does not exist`);
          }
        }
      }

      // Validate entity exists if entityId is provided
      if (updateUserRequest.entityId) {
        const entityExists = await this.userService.entityExists(updateUserRequest.entityId);
        if (!entityExists) {
          throw new BadRequestException(`Entity with ID ${updateUserRequest.entityId} does not exist`);
        }
      }

      // Validate account exists if accountId is provided
      if (updateUserRequest.accountId) {
        const accountExists = await this.userService.accountExists(updateUserRequest.accountId);
        if (!accountExists) {
          throw new BadRequestException(`Account with ID ${updateUserRequest.accountId} does not exist`);
        }
      }

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
  @RequireRoles(UserType.admin, UserType.operator)
  async deleteUser(@Param("id") id: string): Promise<{ success: boolean }> {
    try {
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
