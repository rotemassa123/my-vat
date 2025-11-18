import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IWidgetRepository } from 'src/Common/ApplicationCore/Services/IWidgetRepository';
import { CreateWidgetRequest, UpdateWidgetRequest } from '../Requests/widget.requests';
import { WidgetResponse, WidgetDataResponse } from '../Responses/widget.responses';
import { logger } from 'src/Common/Infrastructure/Config/Logger';
import { WidgetDataService } from './widget-data.service';

@Injectable()
export class WidgetService {
  constructor(
    @Inject('IWidgetRepository') private widgetRepository: IWidgetRepository,
    private widgetDataService: WidgetDataService,
  ) {}

  async createWidget(request: CreateWidgetRequest): Promise<WidgetResponse> {
    try {
      const widget = await this.widgetRepository.create({
        type: request.type,
        dataConfig: request.dataConfig,
        displayConfig: request.displayConfig,
        layout: request.layout,
      });
      return this.mapToResponse(widget);
    } catch (error) {
      logger.error('Error creating widget', 'WidgetService', { error });
      throw error;
    }
  }

  async getWidgets(): Promise<WidgetResponse[]> {
    try {
      const widgets = await this.widgetRepository.findAll();
      return widgets.map(this.mapToResponse);
    } catch (error) {
      logger.error('Error getting widgets', 'WidgetService', { error });
      throw error;
    }
  }

  async getWidget(id: string): Promise<WidgetResponse> {
    try {
      const widget = await this.widgetRepository.findById(id);
      if (!widget) {
        throw new NotFoundException(`Widget with ID ${id} not found`);
      }
      return this.mapToResponse(widget);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting widget', 'WidgetService', { error, id });
      throw error;
    }
  }

  async updateWidget(id: string, request: UpdateWidgetRequest): Promise<WidgetResponse> {
    try {
      const updateData: any = {};
      
      if (request.type !== undefined) {
        updateData.type = request.type;
      }
      if (request.dataConfig !== undefined) {
        updateData.dataConfig = request.dataConfig;
      }
      if (request.displayConfig !== undefined) {
        updateData.displayConfig = request.displayConfig;
      }
      if (request.layout !== undefined) {
        updateData.layout = request.layout;
      }
      if (request.isActive !== undefined) {
        updateData.isActive = request.isActive;
      }

      const widget = await this.widgetRepository.update(id, updateData);
      if (!widget) {
        throw new NotFoundException(`Widget with ID ${id} not found`);
      }
      return this.mapToResponse(widget);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error updating widget', 'WidgetService', { error, id });
      throw error;
    }
  }

  async deleteWidget(id: string): Promise<void> {
    try {
      const success = await this.widgetRepository.delete(id);
      if (!success) {
        throw new NotFoundException(`Widget with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error deleting widget', 'WidgetService', { error, id });
      throw error;
    }
  }

  async getWidgetData(id: string): Promise<WidgetDataResponse> {
    try {
      const widget = await this.widgetRepository.findById(id);
      if (!widget) {
        throw new NotFoundException(`Widget with ID ${id} not found`);
      }
      
      const data = await this.widgetDataService.fetchWidgetData(widget);
      return {
        widgetId: widget._id.toString(),
        type: widget.type,
        data,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      logger.error('Error getting widget data', 'WidgetService', { error, id });
      throw error;
    }
  }

  private mapToResponse(widget: any): WidgetResponse {
    return {
      id: widget._id.toString(),
      userId: widget.user_id.toString(),
      type: widget.type,
      dataConfig: widget.data_config,
      displayConfig: widget.display_config,
      layout: widget.layout,
      isActive: widget.is_active,
      createdAt: widget.created_at,
      updatedAt: widget.updated_at,
      entityId: widget.entity_id?.toString(),
    };
  }
}

