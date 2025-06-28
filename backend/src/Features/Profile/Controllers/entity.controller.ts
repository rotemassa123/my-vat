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
import { CreateEntityRequest, UpdateEntityRequest } from "../Requests/profile.requests";
import { EntityResponse, CreateEntityResponse } from "../Responses/profile.responses";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("entities")
@Controller("entities")
export class EntityController {
  constructor(private entityService: IProfileRepository) {}

  @Get()
  @ApiQuery({ name: "accountId", required: false, type: String })
  async getEntities(@Query("accountId") accountId?: string): Promise<EntityResponse[]> {
    try {
      if (accountId) {
        const entities = await this.entityService.findEntitiesByAccountId(accountId);
        return entities as EntityResponse[];
      }

      throw new BadRequestException("'accountId' query parameter is required");
    } catch (error) {
      logger.error("Error fetching entities", EntityController.name, { error: error.message, accountId });
      throw error;
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
  async createEntity(@Body() createEntityRequest: CreateEntityRequest): Promise<CreateEntityResponse> {
    try {
      const entity = await this.entityService.createEntity(createEntityRequest);
      if (!entity._id) {
        throw new BadRequestException('Failed to create entity - no ID returned');
      }
      return { _id: entity._id };
    } catch (error) {
      logger.error("Error creating entity", EntityController.name, { 
        error: error.message, 
        accountId: createEntityRequest.accountId,
        name: createEntityRequest.name
      });
      throw error;
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