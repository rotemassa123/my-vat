import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { WidgetService } from '../Services/widget.service';
import { CreateWidgetRequest, UpdateWidgetRequest } from '../Requests/widget.requests';
import { WidgetResponse, WidgetListResponse, WidgetDataResponse } from '../Responses/widget.responses';
import { AuthenticationGuard } from 'src/Common/Infrastructure/guards/authentication.guard';
import { GlobalFilters } from '../Services/widget-data.service';

@ApiTags('widgets')
@Controller('widgets')
@UseGuards(AuthenticationGuard)
export class WidgetController {
  constructor(private widgetService: WidgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new widget' })
  @ApiResponse({ status: 201, description: 'Widget created successfully', type: WidgetResponse })
  async createWidget(
    @Body() request: CreateWidgetRequest,
  ): Promise<WidgetResponse> {
    return this.widgetService.createWidget(request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all widgets for the current user with pre-loaded data' })
  @ApiResponse({ status: 200, description: 'Widgets with data retrieved successfully', type: [WidgetResponse] })
  async getWidgets(): Promise<WidgetResponse[]> {
    return await this.widgetService.getWidgetsWithData();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific widget by ID' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget retrieved successfully', type: WidgetResponse })
  async getWidget(
    @Param('id') id: string,
  ): Promise<WidgetResponse> {
    return this.widgetService.getWidget(id);
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get widget data (aggregated chart data)' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget data retrieved successfully', type: WidgetDataResponse })
  async getWidgetData(
    @Param('id') id: string,
  ): Promise<WidgetDataResponse> {
    return this.widgetService.getWidgetData(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget updated successfully', type: WidgetResponse })
  async updateWidget(
    @Param('id') id: string,
    @Body() request: UpdateWidgetRequest,
  ): Promise<WidgetResponse> {
    return this.widgetService.updateWidget(id, request);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh widget data by recalculating and updating stored data' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget data refreshed successfully', type: WidgetResponse })
  async refreshWidgetData(
    @Param('id') id: string,
  ): Promise<WidgetResponse> {
    return this.widgetService.refreshWidgetData(id);
  }

  @Post('refresh/all')
  @ApiOperation({ summary: 'Refresh data for all widgets with optional global filters' })
  @ApiQuery({ name: 'entityIds', required: false, type: String, description: 'Comma-separated list of entity IDs' })
  @ApiQuery({ name: 'country', required: false, type: String, description: 'Country code' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date for time range filter (YYYY-MM-DD format)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date for time range filter (YYYY-MM-DD format)' })
  @ApiResponse({ status: 200, description: 'All widgets data refreshed successfully', type: [WidgetResponse] })
  async refreshAllWidgetsData(
    @Query('entityIds') entityIds?: string,
    @Query('country') country?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WidgetResponse[]> {
    const globalFilters: GlobalFilters | undefined = this.parseFilters(
      entityIds,
      country,
      startDate,
      endDate,
    );
    return this.widgetService.refreshAllWidgetsData(globalFilters);
  }

  private parseFilters(
    entityIds?: string,
    country?: string,
    startDate?: string,
    endDate?: string,
  ): GlobalFilters | undefined {
    const hasFilters = entityIds || country || startDate || endDate;
    if (!hasFilters) {
      return undefined;
    }

    const filters: GlobalFilters = {};

    if (entityIds) {
      filters.entityIds = entityIds.split(',').filter(id => id.trim().length > 0);
    }

    if (country) {
      filters.country = country;
    }

    if (startDate || endDate) {
      filters.dateRange = {
        start: startDate ? new Date(startDate) : new Date(0),
        end: endDate ? new Date(endDate) : new Date(),
      };
    }

    return filters;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  async deleteWidget(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.widgetService.deleteWidget(id);
    return { message: 'Widget deleted successfully' };
  }
}

