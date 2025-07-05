import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ApiTags, ApiParam } from "@nestjs/swagger";
import { CreateEntityBodyDto, UpdateEntityRequest } from "../Requests/profile.requests";
import { EntityResponse, CreateEntityResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { CurrentAccountId } from "../../../common/decorators/current-account-id.decorator";

@ApiTags("entities")
@Controller("entities")
export class EntityController {
  constructor(private readonly entityService: IProfileRepository) {}

  @Get()
  async getEntities(@CurrentAccountId() accountId: string): Promise<EntityResponse[]> {
    try {
      return await this.entityService.getEntitiesForAccount();
    } catch (error) {
      logger.error("Error fetching entities", EntityController.name, { error: error.message, accountId });
      throw new InternalServerErrorException("Failed to fetch entities");
    }
  }

  @Get(":id")
  @ApiParam({ name: "id", type: String })
  async getEntityById(@Param("id") id: string): Promise<EntityResponse> {
    try {
      const entity = await this.entityService.findEntityById(id);
      if (!entity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }
      return entity as EntityResponse;
    } catch (error) {
      logger.error("Error fetching entity by ID", EntityController.name, { error: error.message, id });
      throw error;
    }
  }

  @Post()
  async createEntity(
    @CurrentAccountId() accountId: string,
    @Body() createEntityRequest: CreateEntityBodyDto,
  ): Promise<CreateEntityResponse> {
    try {
      const accountExists = await this.entityService.accountExists(accountId);
      if (!accountExists) {
        throw new BadRequestException(`Account with ID ${accountId} does not exist`);
      }
      const entity = await this.entityService.createEntity({ ...createEntityRequest, accountId });
      return { _id: entity._id };
    } catch (error) {
      logger.error("Error creating entity", EntityController.name, { 
        error: error.message, 
        accountId: accountId,
        request: createEntityRequest 
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException("Failed to create entity");
    }
  }

  @Put(":id")
  @ApiParam({ name: "id", type: String })
  async updateEntity(
    @Param("id") id: string,
    @Body() updateEntityRequest: UpdateEntityRequest
  ): Promise<EntityResponse> {
    try {
      // Check if entity exists
      const existingEntity = await this.entityService.findEntityById(id);
      if (!existingEntity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }

      const updated = await this.entityService.updateEntity(id, updateEntityRequest);
      if (!updated) {
        throw new BadRequestException(`Failed to update entity with ID ${id}`);
      }

      const updatedEntity = await this.entityService.findEntityById(id);
      return updatedEntity as EntityResponse;
    } catch (error) {
      logger.error("Error updating entity", EntityController.name, { error: error.message, id });
      throw error;
    }
  }

  @Delete(":id")
  @ApiParam({ name: "id", type: String })
  async deleteEntity(@Param("id") id: string): Promise<{ success: boolean }> {
    try {
      // Check if entity exists
      const existingEntity = await this.entityService.findEntityById(id);
      if (!existingEntity) {
        throw new NotFoundException(`Entity with ID ${id} not found`);
      }

      const deleted = await this.entityService.deleteEntity(id);
      if (!deleted) {
        throw new BadRequestException(`Failed to delete entity with ID ${id}`);
      }

      return { success: true };
    } catch (error) {
      logger.error("Error deleting entity", EntityController.name, { error: error.message, id });
      throw error;
    }
  }
}