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
import { CreateAccountRequest, UpdateAccountRequest } from "../Requests/profile.requests";
import { AccountResponse, CreateAccountResponse, UserResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { PublicEndpointGuard } from "src/Common/Infrastructure/decorators/publicEndpoint.decorator";
import { RequireRoles } from "src/Common/Infrastructure/decorators/require-roles.decorator";
import { UserRole } from "src/Common/consts/userRole";
import { UseGuards } from "@nestjs/common";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { mapUserDataToResponse } from "src/Common/utils/user-mapper";

@ApiTags("accounts")
@Controller("accounts")
export class AccountController {
  constructor(private accountService: IProfileRepository) {}

  @Get()
  @ApiQuery({ name: "id", required: false, type: String })
  async getAccounts(
    @Query("id") id?: string
  ): Promise<AccountResponse[]> {
    try {
      if (id) {
        const account = await this.accountService.findAccountById(id);
        if (!account) {
          throw new NotFoundException(`Account with ID ${id} not found`);
        }
        return [account as AccountResponse];
      }

      throw new BadRequestException("'id' query parameter is required");
    } catch (error) {
      logger.error("Error fetching accounts", AccountController.name, { error: error.message, id });
      throw error;
    }
  }

  @Get("all")
  @UseGuards(AuthenticationGuard)
  @RequireRoles(UserRole.OPERATOR)
  async getAllAccounts(): Promise<AccountResponse[]> {
    try {
      const accounts = await this.accountService.getAllAccounts();
      return accounts as AccountResponse[];
    } catch (error) {
      logger.error("Error fetching all accounts", AccountController.name, { error: error.message });
      throw error;
    }
  }

  @Get(":id/users")
  @ApiParam({ name: "id", type: String })
  @UseGuards(AuthenticationGuard)
  @RequireRoles(UserRole.OPERATOR)
  async getUsersForAccount(
    @Param("id") id: string,
  ): Promise<UserResponse[]> {
    try {
      const exists = await this.accountService.accountExists(id);
      if (!exists) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      const users = await this.accountService.getUsersForAccountId(id);
      return users.map(mapUserDataToResponse);
    } catch (error) {
      logger.error("Error fetching account users", AccountController.name, { error: error.message, id });
      throw error;
    }
  }


  @Get(":id")
  @ApiParam({ name: "id", type: String })
  async getAccountById(@Param("id") id: string): Promise<AccountResponse> {
    try {
      const account = await this.accountService.findAccountById(id);
      if (!account) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }
      return account as AccountResponse;
    } catch (error) {
      logger.error("Error fetching account by ID", AccountController.name, { error: error.message, id });
      throw error;
    }
  }

  @PublicEndpointGuard()
  @Post()
  async createAccount(@Body() createAccountRequest: CreateAccountRequest): Promise<CreateAccountResponse> {
    try {
      const account = await this.accountService.createAccount(createAccountRequest);
      if (!account._id) {
        throw new BadRequestException('Failed to create account - no ID returned');
      }
      return { _id: account._id };
    } catch (error) {
      logger.error("Error creating account", AccountController.name, { 
        error: error.message
      });
      throw error;
    }
  }

  @Put(":id")
  @ApiParam({ name: "id", type: String })
  async updateAccount(
    @Param("id") id: string,
    @Body() updateAccountRequest: UpdateAccountRequest
  ): Promise<AccountResponse> {
    try {
      // Check if account exists
      const existingAccount = await this.accountService.findAccountById(id);
      if (!existingAccount) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      const updated = await this.accountService.updateAccount(id, updateAccountRequest);
      if (!updated) {
        throw new BadRequestException(`Failed to update account with ID ${id}`);
      }

      const updatedAccount = await this.accountService.findAccountById(id);
      return updatedAccount as AccountResponse;
    } catch (error) {
      logger.error("Error updating account", AccountController.name, { error: error.message, id });
      throw error;
    }
  }

  @Delete(":id")
  @ApiParam({ name: "id", type: String })
  async deleteAccount(@Param("id") id: string): Promise<{ success: boolean }> {
    try {
      // Check if account exists
      const existingAccount = await this.accountService.findAccountById(id);
      if (!existingAccount) {
        throw new NotFoundException(`Account with ID ${id} not found`);
      }

      const deleted = await this.accountService.deleteAccount(id);
      if (!deleted) {
        throw new BadRequestException(`Failed to delete account with ID ${id}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting account", AccountController.name, { error: error.message, id });
      throw error;
    }
  }
}
