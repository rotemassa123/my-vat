# Analysis Widgets Feature - Development Guide

## Overview

Users can create, edit, delete, and manage custom widgets (pie, bar, histogram, line charts) that persist across sessions. Widgets display data from invoices/summaries/entities based on user-configured X/Y axis fields.

## Architecture

### Stack
- **Backend**: NestJS, MongoDB (Mongoose), JWT auth
- **Frontend**: React 18, TypeScript, Material-UI, @mui/x-charts, Zustand, React Query
- **Key Principle**: Backend aggregates widget data; frontend only displays it

### Data Model

**Widget Schema:**
- `id`, `user_id`, `account_id`, `entity_id`
- `type`: `pie` | `bar` | `histogram` | `line`
- `data_config`: `{ source, xAxisField, yAxisField, filters }`
- `display_config`: `{ title, showLabels, showLegend, showGridLines, axisLabels, colors }`
- `layout`: `{ x, y, w, h }` (optional, for future drag-and-drop)

### User Flow (Figma-Based)

1. **Dashboard**: Empty state → Grid of widget cards
2. **Create Wizard**: 4 steps (Type → Config → Preview → Summary)
3. **Modals**: Edit, Delete, Preview & Export, Connect Data Source, Help & Support

---

## Phase 1: Backend Foundation

### 1.1 Widget Schema

**File**: `backend/src/Common/Infrastructure/DB/schemas/widget.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type WidgetDocument = HydratedDocument<Widget>;

export enum WidgetType {
  PIE = 'pie',
  BAR = 'bar',
  HISTOGRAM = 'histogram',
  LINE = 'line',
}

export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
    entityIds?: string[];
    [key: string]: any;
  };
}

export interface WidgetDisplayConfig {
  title: string;
  showLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  colors?: string[];
  axisLabels?: { x?: string; y?: string };
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'widgets' })
export class Widget {
  account_id: MongooseSchema.Types.ObjectId;
  entity_id?: MongooseSchema.Types.ObjectId;
  
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, index: true })
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: WidgetType })
  type: WidgetType;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  data_config: WidgetDataConfig;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  display_config: WidgetDisplayConfig;

  @Prop({ type: MongooseSchema.Types.Mixed })
  layout?: WidgetLayout;

  @Prop({ default: true })
  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}

export const WidgetSchema = SchemaFactory.createForClass(Widget);
WidgetSchema.index({ user_id: 1, is_active: 1 });
WidgetSchema.index({ account_id: 1, user_id: 1 });
```

### 1.2 Repository Interface & Implementation

**File**: `backend/src/Common/ApplicationCore/Services/IWidgetRepository.ts`

```typescript
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export interface CreateWidgetData {
  userId: string;
  type: WidgetType;
  dataConfig: WidgetDataConfig;
  displayConfig: WidgetDisplayConfig;
  layout?: WidgetLayout;
  entityId?: string;
}

export interface UpdateWidgetData {
  type?: WidgetType;
  dataConfig?: WidgetDataConfig;
  displayConfig?: WidgetDisplayConfig;
  layout?: WidgetLayout;
  isActive?: boolean;
}

export interface IWidgetRepository {
  create(data: CreateWidgetData): Promise<WidgetDocument>;
  findById(id: string, accountId: string): Promise<WidgetDocument | null>;
  findByUserId(userId: string, accountId: string): Promise<WidgetDocument[]>;
  update(id: string, accountId: string, data: UpdateWidgetData): Promise<WidgetDocument | null>;
  delete(id: string, accountId: string): Promise<boolean>;
}
```

**File**: `backend/src/Common/Infrastructure/Repositories/widget.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Widget, WidgetDocument } from '../DB/schemas/widget.schema';
import { IWidgetRepository, CreateWidgetData, UpdateWidgetData } from 'src/Common/ApplicationCore/Services/IWidgetRepository';
import { logger } from '../Config/Logger';

@Injectable()
export class WidgetRepository implements IWidgetRepository {
  constructor(
    @InjectModel(Widget.name) private widgetModel: Model<WidgetDocument>,
  ) {}

  async create(data: CreateWidgetData): Promise<WidgetDocument> {
    try {
      const widget = new this.widgetModel({
        user_id: data.userId,
        type: data.type,
        data_config: data.dataConfig,
        display_config: data.displayConfig,
        layout: data.layout,
        entity_id: data.entityId,
        is_active: true,
      });
      return await widget.save();
    } catch (error) {
      logger.error('Error creating widget', 'WidgetRepository', { error, data });
      throw error;
    }
  }

  async findById(id: string, accountId: string): Promise<WidgetDocument | null> {
    return this.widgetModel.findOne({ _id: id, account_id: accountId }).exec();
  }

  async findByUserId(userId: string, accountId: string): Promise<WidgetDocument[]> {
    return this.widgetModel
      .find({ user_id: userId, account_id: accountId, is_active: true })
      .sort({ created_at: -1 })
      .exec();
  }

  async update(id: string, accountId: string, data: UpdateWidgetData): Promise<WidgetDocument | null> {
    try {
      return this.widgetModel.findOneAndUpdate(
        { _id: id, account_id: accountId },
        { $set: { ...data, updated_at: new Date() } },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Error updating widget', 'WidgetRepository', { error, id, accountId });
      throw error;
    }
  }

  async delete(id: string, accountId: string): Promise<boolean> {
    try {
      const result = await this.widgetModel.findOneAndUpdate(
        { _id: id, account_id: accountId },
        { $set: { is_active: false, updated_at: new Date() } }
      ).exec();
      return !!result;
    } catch (error) {
      logger.error('Error deleting widget', 'WidgetRepository', { error, id, accountId });
      throw error;
    }
  }
}
```

**Note**: AccountScopePlugin and EntityScopePlugin automatically add `account_id`/`entity_id` filters to queries and set them on save. No manual handling needed.

### 1.3 DTOs

**File**: `backend/src/Features/Analysis/Requests/widget.requests.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString, IsOptional, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export class WidgetDataConfigDto implements WidgetDataConfig {
  @ApiProperty({ enum: ['invoices', 'summaries', 'entities', 'custom'] })
  @IsString()
  source: 'invoices' | 'summaries' | 'entities' | 'custom';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  xAxisField?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yAxisField?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filters?: any;
}

export class WidgetDisplayConfigDto implements WidgetDisplayConfig {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showLabels?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showLegend?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showGridLines?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  colors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  axisLabels?: { x?: string; y?: string };
}

export class WidgetLayoutDto implements WidgetLayout {
  @ApiProperty()
  x: number;
  @ApiProperty()
  y: number;
  @ApiProperty()
  w: number;
  @ApiProperty()
  h: number;
}

export class CreateWidgetRequest {
  @ApiProperty({ enum: WidgetType })
  @IsEnum(WidgetType)
  type: WidgetType;

  @ApiProperty({ type: WidgetDataConfigDto })
  @ValidateNested()
  @Type(() => WidgetDataConfigDto)
  dataConfig: WidgetDataConfigDto;

  @ApiProperty({ type: WidgetDisplayConfigDto })
  @ValidateNested()
  @Type(() => WidgetDisplayConfigDto)
  displayConfig: WidgetDisplayConfigDto;

  @ApiPropertyOptional({ type: WidgetLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetLayoutDto)
  layout?: WidgetLayoutDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entityId?: string;
}

export class UpdateWidgetRequest {
  @ApiPropertyOptional({ enum: WidgetType })
  @IsOptional()
  @IsEnum(WidgetType)
  type?: WidgetType;

  @ApiPropertyOptional({ type: WidgetDataConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetDataConfigDto)
  dataConfig?: WidgetDataConfigDto;

  @ApiPropertyOptional({ type: WidgetDisplayConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetDisplayConfigDto)
  displayConfig?: WidgetDisplayConfigDto;

  @ApiPropertyOptional({ type: WidgetLayoutDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WidgetLayoutDto)
  layout?: WidgetLayoutDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
```

**File**: `backend/src/Features/Analysis/Responses/widget.responses.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export class WidgetResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: WidgetType })
  type: WidgetType;

  @ApiProperty()
  dataConfig: WidgetDataConfig;

  @ApiProperty()
  displayConfig: WidgetDisplayConfig;

  @ApiPropertyOptional()
  layout?: WidgetLayout;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  entityId?: string;
}

export class WidgetListResponse {
  @ApiProperty({ type: [WidgetResponse] })
  widgets: WidgetResponse[];
}

export class WidgetDataResponse {
  @ApiProperty()
  widgetId: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ type: [Object], example: [{ label: 'Category A', value: 100 }] })
  data: Array<{ label: string; value: number }>;

  @ApiProperty()
  timestamp: Date;
}
```

### 1.4 Widget Service

**File**: `backend/src/Features/Analysis/Services/widget.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { IWidgetRepository } from 'src/Common/ApplicationCore/Services/IWidgetRepository';
import { CreateWidgetRequest, UpdateWidgetRequest } from '../Requests/widget.requests';
import { WidgetResponse, WidgetListResponse, WidgetDataResponse } from '../Responses/widget.responses';
import { CurrentAccountId } from 'src/Common/decorators/current-account-id.decorator';
import { logger } from 'src/Common/Infrastructure/Config/Logger';
import { WidgetDataService } from './widget-data.service';

@Injectable()
export class WidgetService {
  constructor(
    private widgetRepository: IWidgetRepository,
    private widgetDataService: WidgetDataService,
  ) {}

  async createWidget(userId: string, accountId: string, request: CreateWidgetRequest): Promise<WidgetResponse> {
    try {
      const widget = await this.widgetRepository.create({
        userId,
        type: request.type,
        dataConfig: request.dataConfig,
        displayConfig: request.displayConfig,
        layout: request.layout,
        entityId: request.entityId,
      });
      return this.mapToResponse(widget);
    } catch (error) {
      logger.error('Error creating widget', 'WidgetService', { error, userId, accountId });
      throw error;
    }
  }

  async getWidgets(userId: string, accountId: string): Promise<WidgetResponse[]> {
    const widgets = await this.widgetRepository.findByUserId(userId, accountId);
    return widgets.map(this.mapToResponse);
  }

  async getWidget(id: string, accountId: string): Promise<WidgetResponse> {
    const widget = await this.widgetRepository.findById(id, accountId);
    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }
    return this.mapToResponse(widget);
  }

  async updateWidget(id: string, accountId: string, request: UpdateWidgetRequest): Promise<WidgetResponse> {
    const widget = await this.widgetRepository.update(id, accountId, request);
    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }
    return this.mapToResponse(widget);
  }

  async deleteWidget(id: string, accountId: string): Promise<void> {
    const success = await this.widgetRepository.delete(id, accountId);
    if (!success) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }
  }

  async getWidgetData(id: string, accountId: string): Promise<WidgetDataResponse> {
    const widget = await this.widgetRepository.findById(id, accountId);
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
```

### 1.5 Widget Data Service (CRITICAL)

**File**: `backend/src/Features/Analysis/Services/widget-data.service.ts`

**This is where data aggregation happens on the backend** (following monday.com pattern).

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetDataConfig } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { logger } from 'src/Common/Infrastructure/Config/Logger';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Injectable()
export class WidgetDataService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    // Add other models (Summary, Entity) as needed
  ) {}

  async fetchWidgetData(widget: WidgetDocument): Promise<ChartDataPoint[]> {
    const config = widget.data_config as WidgetDataConfig;
    
    switch (config.source) {
      case 'invoices':
        return this.fetchInvoiceData(config);
      case 'summaries':
        return this.fetchSummaryData(config);
      case 'entities':
        return this.fetchEntityData(config);
      default:
        throw new Error(`Unsupported data source: ${config.source}`);
    }
  }

  private async fetchInvoiceData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.xAxisField || !config.yAxisField) return [];

    const pipeline: any[] = [];

    // Match stage (filters) - AccountScopePlugin automatically adds account_id filter
    const matchStage: any = {};
    if (config.filters?.dateRange) {
      matchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    if (config.filters?.entityIds?.length) {
      matchStage.entity_id = { $in: config.filters.entityIds.map((id: string) => new Types.ObjectId(id)) };
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Map field names to actual DB fields
    // xAxisField options: 'Date', 'Category', 'Product', 'Region' -> map to invoice fields
    // yAxisField options: 'Revenue', 'Count', 'Percentage', 'Value' -> map to invoice fields
    const xAxisDbField = this.mapXAxisFieldToDb(config.xAxisField);
    const yAxisDbField = this.mapYAxisFieldToDb(config.yAxisField);

    // Group by X-axis, aggregate Y-axis
    pipeline.push({
      $group: {
        _id: `$${xAxisDbField}`,
        value: this.getAggregationOperation(yAxisDbField, config.yAxisField),
      },
    });

    // Sort
    if (config.xAxisField.toLowerCase() === 'date') {
      pipeline.push({ $sort: { _id: 1 } });
    } else {
      pipeline.push({ $sort: { value: -1 } });
    }

    try {
      const results = await this.invoiceModel.aggregate(pipeline).exec();
      return results.map((result: any) => ({
        label: String(result._id || 'Unknown'),
        value: result.value || 0,
      }));
    } catch (error) {
      logger.error('Error fetching invoice data for widget', 'WidgetDataService', { error, config });
      throw error;
    }
  }

  // Map user-friendly field names to actual database field names
  private mapXAxisFieldToDb(field: string): string {
    const mapping: Record<string, string> = {
      'Date': 'created_at',
      'Category': 'source', // or appropriate category field
      'Product': 'name', // or appropriate product field
      'Region': 'country', // from summary_content if available
    };
    return mapping[field] || field.toLowerCase();
  }

  private mapYAxisFieldToDb(field: string): string {
    const mapping: Record<string, string> = {
      'Revenue': 'claim_amount', // or total_amount from summary
      'Value': 'claim_amount',
      'Amount': 'claim_amount',
      'Count': '_id', // Will use $sum: 1 for count
    };
    return mapping[field] || field.toLowerCase();
  }

  private getAggregationOperation(yAxisDbField: string, yAxisField: string): any {
    // For Count, always use $sum: 1
    if (yAxisField === 'Count' || yAxisField === 'Percentage') {
      return { $sum: 1 };
    }
    // For numeric fields, sum the field value
    // Note: If field doesn't exist in invoice, may need to join with summary
    return { $sum: `$${yAxisDbField}` };
  }

  private async fetchSummaryData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    // Similar MongoDB aggregation pipeline for summaries
    // TODO: Implement based on Summary schema
    return [];
  }

  private async fetchEntityData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    // Similar MongoDB aggregation pipeline for entities
    // TODO: Implement based on Entity schema
    return [];
  }
}
```

### 1.6 Controller

**File**: `backend/src/Features/Analysis/Controllers/widget.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { WidgetService } from '../Services/widget.service';
import { CreateWidgetRequest, UpdateWidgetRequest } from '../Requests/widget.requests';
import { WidgetResponse, WidgetListResponse, WidgetDataResponse } from '../Responses/widget.responses';
import { AuthenticationGuard } from 'src/Common/Infrastructure/guards/authentication.guard';
import { CurrentUserId } from 'src/Common/decorators/current-user-id.decorator';
import { CurrentAccountId } from 'src/Common/decorators/current-account-id.decorator';

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
    @CurrentUserId() userId: string,
    @CurrentAccountId() accountId: string,
  ): Promise<WidgetResponse> {
    return this.widgetService.createWidget(userId, accountId, request);
  }

  @Get()
  @ApiOperation({ summary: 'Get all widgets for the current user' })
  @ApiResponse({ status: 200, description: 'Widgets retrieved successfully', type: WidgetListResponse })
  async getWidgets(
    @CurrentUserId() userId: string,
    @CurrentAccountId() accountId: string,
  ): Promise<WidgetListResponse> {
    const widgets = await this.widgetService.getWidgets(userId, accountId);
    return { widgets };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific widget by ID' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget retrieved successfully', type: WidgetResponse })
  async getWidget(
    @Param('id') id: string,
    @CurrentAccountId() accountId: string,
  ): Promise<WidgetResponse> {
    return this.widgetService.getWidget(id, accountId);
  }

  @Get(':id/data')
  @ApiOperation({ summary: 'Get widget data (aggregated chart data)' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget data retrieved successfully', type: WidgetDataResponse })
  async getWidgetData(
    @Param('id') id: string,
    @CurrentAccountId() accountId: string,
  ): Promise<WidgetDataResponse> {
    return this.widgetService.getWidgetData(id, accountId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget updated successfully', type: WidgetResponse })
  async updateWidget(
    @Param('id') id: string,
    @Body() request: UpdateWidgetRequest,
    @CurrentAccountId() accountId: string,
  ): Promise<WidgetResponse> {
    return this.widgetService.updateWidget(id, accountId, request);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a widget' })
  @ApiParam({ name: 'id', description: 'Widget ID' })
  @ApiResponse({ status: 200, description: 'Widget deleted successfully' })
  async deleteWidget(
    @Param('id') id: string,
    @CurrentAccountId() accountId: string,
  ): Promise<{ message: string }> {
    await this.widgetService.deleteWidget(id, accountId);
    return { message: 'Widget deleted successfully' };
  }
}
```

### 1.7 Module Setup

**File**: `backend/src/Features/Analysis/analysisInfra.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Widget, WidgetSchema } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceSchema } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { WidgetRepository } from 'src/Common/Infrastructure/Repositories/widget.repository';
import { IWidgetRepository } from 'src/Common/ApplicationCore/Services/IWidgetRepository';
import { AccountScopePlugin } from 'src/Common/Infrastructure/DB/plugins/account-scope.plugin';
import { EntityScopePlugin } from 'src/Common/Infrastructure/DB/plugins/entity-scope.plugin';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Widget.name,
        useFactory: () => {
          const schema = WidgetSchema;
          schema.plugin(AccountScopePlugin);
          schema.plugin(EntityScopePlugin);
          return schema;
        },
      },
      { name: Invoice.name, useFactory: () => InvoiceSchema },
    ]),
  ],
  providers: [{ provide: IWidgetRepository, useClass: WidgetRepository }],
  exports: [IWidgetRepository, MongooseModule],
})
export class AnalysisInfraModule {}
```

**File**: `backend/src/Features/Analysis/analysis.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AnalysisInfraModule } from './analysisInfra.module';
import { WidgetController } from './Controllers/widget.controller';
import { WidgetService } from './Services/widget.service';
import { WidgetDataService } from './Services/widget-data.service';

@Module({
  imports: [AnalysisInfraModule],
  controllers: [WidgetController],
  providers: [WidgetService, WidgetDataService],
  exports: [WidgetService],
})
export class AnalysisModule {}
```

Register in `app.module.ts`.

---

## Phase 2: Frontend Core

### 2.1 Types

**File**: `frontend/src/types/widget.ts`

Mirror backend types (WidgetType enum, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout, Widget interface).

### 2.2 API Client

**File**: `frontend/src/lib/api/widgets.ts`

```typescript
import api from './api';
import { Widget, CreateWidgetRequest, UpdateWidgetRequest } from '../../types/widget';

export interface WidgetDataResponse {
  widgetId: string;
  type: string;
  data: Array<{ label: string; value: number }>;
  timestamp: string;
}

export const widgetApi = {
  getAll: () => api.get<{ widgets: Widget[] }>('/widgets').then(r => r.data.widgets),
  getById: (id: string) => api.get<Widget>(`/widgets/${id}`).then(r => r.data),
  create: (data: CreateWidgetRequest) => api.post<Widget>('/widgets', data).then(r => r.data),
  update: (id: string, data: UpdateWidgetRequest) => api.put<Widget>(`/widgets/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/widgets/${id}`),
  getData: (id: string) => api.get<WidgetDataResponse>(`/widgets/${id}/data`).then(r => r.data),
};
```

### 2.3 React Query Hooks

**File**: `frontend/src/hooks/analysis/useWidgets.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { widgetApi, WidgetDataResponse } from '../../lib/api/widgets';
import { Widget, CreateWidgetRequest, UpdateWidgetRequest } from '../../types/widget';

export const useWidgets = () => {
  return useQuery({
    queryKey: ['widgets'],
    queryFn: widgetApi.getAll,
    staleTime: 30000,
  });
};

export const useWidgetData = (widgetId: string | null) => {
  return useQuery({
    queryKey: ['widget-data', widgetId],
    queryFn: () => widgetApi.getData(widgetId!),
    enabled: !!widgetId,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
};

export const useCreateWidget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: widgetApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['widgets'] }),
  });
};

export const useUpdateWidget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWidgetRequest }) => widgetApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      queryClient.invalidateQueries({ queryKey: ['widget-data', id] });
    },
  });
};

export const useDeleteWidget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: widgetApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['widgets'] }),
  });
};
```

### 2.4 Widget Store (Zustand)

**File**: `frontend/src/store/widgetStore.ts`

Manage wizard state and modal states:

```typescript
import { create } from 'zustand';
import { Widget, WidgetType } from '../types/widget';

interface WidgetWizardState {
  step: 1 | 2 | 3 | 4;
  selectedType: WidgetType | null;
  title: string;
  xAxisField: string;
  yAxisField: string;
  showLabels: boolean;
  showLegend: boolean;
  showGridLines: boolean;
}

interface WidgetStore {
  wizardState: WidgetWizardState;
  setWizardStep: (step: 1 | 2 | 3 | 4) => void;
  setWizardType: (type: WidgetType) => void;
  setWizardTitle: (title: string) => void;
  setWizardXAxis: (field: string) => void;
  setWizardYAxis: (field: string) => void;
  setWizardOptions: (options: Partial<Pick<WidgetWizardState, 'showLabels' | 'showLegend' | 'showGridLines'>>) => void;
  resetWizard: () => void;
  
  // Modals
  editingWidget: Widget | null;
  deletingWidget: Widget | null;
  previewingWidget: Widget | null;
  isCreateWizardOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isPreviewExportOpen: boolean;
  isConnectDataSourceOpen: boolean;
  isHelpSupportOpen: boolean;
  
  // Modal actions
  openCreateWizard: () => void;
  closeCreateWizard: () => void;
  openEditModal: (widget: Widget) => void;
  closeEditModal: () => void;
  openDeleteModal: (widget: Widget) => void;
  closeDeleteModal: () => void;
  openPreviewExport: (widget: Widget) => void;
  closePreviewExport: () => void;
  openConnectDataSource: () => void;
  closeConnectDataSource: () => void;
  openHelpSupport: () => void;
  closeHelpSupport: () => void;
}

const initialWizardState: WidgetWizardState = {
  step: 1,
  selectedType: null,
  title: '',
  xAxisField: '',
  yAxisField: '',
  showLabels: true,
  showLegend: true,
  showGridLines: false,
};

export const useWidgetStore = create<WidgetStore>((set) => ({
  wizardState: initialWizardState,
  setWizardStep: (step) => set((state) => ({ wizardState: { ...state.wizardState, step } })),
  setWizardType: (type) => set((state) => ({ wizardState: { ...state.wizardState, selectedType: type } })),
  setWizardTitle: (title) => set((state) => ({ wizardState: { ...state.wizardState, title } })),
  setWizardXAxis: (field) => set((state) => ({ wizardState: { ...state.wizardState, xAxisField: field } })),
  setWizardYAxis: (field) => set((state) => ({ wizardState: { ...state.wizardState, yAxisField: field } })),
  setWizardOptions: (options) => set((state) => ({ wizardState: { ...state.wizardState, ...options } })),
  resetWizard: () => set({ wizardState: initialWizardState }),
  
  editingWidget: null,
  deletingWidget: null,
  previewingWidget: null,
  isCreateWizardOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isPreviewExportOpen: false,
  isConnectDataSourceOpen: false,
  isHelpSupportOpen: false,
  
  openCreateWizard: () => set({ isCreateWizardOpen: true, wizardState: initialWizardState }),
  closeCreateWizard: () => set({ isCreateWizardOpen: false, wizardState: initialWizardState }),
  openEditModal: (widget) => set({ editingWidget: widget, isEditModalOpen: true }),
  closeEditModal: () => set({ editingWidget: null, isEditModalOpen: false }),
  openDeleteModal: (widget) => set({ deletingWidget: widget, isDeleteModalOpen: true }),
  closeDeleteModal: () => set({ deletingWidget: null, isDeleteModalOpen: false }),
  openPreviewExport: (widget) => set({ previewingWidget: widget, isPreviewExportOpen: true }),
  closePreviewExport: () => set({ previewingWidget: null, isPreviewExportOpen: false }),
  openConnectDataSource: () => set({ isConnectDataSourceOpen: true }),
  closeConnectDataSource: () => set({ isConnectDataSourceOpen: false }),
  openHelpSupport: () => set({ isHelpSupportOpen: true }),
  closeHelpSupport: () => set({ isHelpSupportOpen: false }),
}));
```

---

## Phase 3: Widget Components

### 3.1 Error Boundary

**File**: `frontend/src/components/analysis/WidgetErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Alert, Button } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
          <ErrorOutline color="error" sx={{ fontSize: 48 }} />
          <Alert severity="error">Widget failed to render</Alert>
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => this.setState({ hasError: false, error: null })}>
            Retry
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

### 3.2 Widget Components

**File**: `frontend/src/components/analysis/widgets/PieChartWidget.tsx`

```typescript
import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Widget } from '../../../types/widget';
import { useWidgetData } from '../../../hooks/analysis/useWidgets';
import { CircularProgress, Box, Alert } from '@mui/material';

export const PieChartWidget: React.FC<{ widget: Widget; preview?: boolean }> = ({ widget, preview = false }) => {
  const { data, isLoading, error } = useWidgetData(widget.id);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: preview ? '200px' : '300px' }}>
        <CircularProgress size={preview ? 40 : 60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: preview ? '200px' : '300px', p: 2 }}>
        <Alert severity="error" sx={{ width: '100%' }}>
          {error instanceof Error ? error.message : 'Failed to load widget data'}
        </Alert>
      </Box>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: preview ? '200px' : '300px', p: 2 }}>
        <Alert severity="info">No data available</Alert>
      </Box>
    );
  }

  const pieChartData = data.data.map((point, index) => ({
    id: index,
    value: point.value,
    label: point.label,
  }));

  return (
    <PieChart
      series={[{
        data: pieChartData,
        innerRadius: widget.displayConfig.showLegend ? 30 : 0,
      }]}
      width={preview ? 300 : 400}
      height={preview ? 200 : 300}
      slotProps={{
        legend: {
          direction: widget.displayConfig.showLegend !== false ? 'row' : 'column',
          position: { vertical: 'bottom', horizontal: 'middle' },
          hidden: !widget.displayConfig.showLegend,
        },
      }}
    />
  );
};
```

**File**: `frontend/src/components/analysis/widgets/BarChartWidget.tsx`

Similar pattern, use `BarChart` from @mui/x-charts:
- `xAxis`: `[{ id: 'barCategories', data: chartData.map(d => d.label), scaleType: 'band', label: widget.displayConfig.axisLabels?.x }]`
- `series`: `[{ data: chartData.map(d => d.value), label: widget.displayConfig.title }]`
- `yAxis`: `[{ label: widget.displayConfig.axisLabels?.y }]`
- `grid`: `{ vertical: widget.displayConfig.showGridLines, horizontal: widget.displayConfig.showGridLines }`

**File**: `frontend/src/components/analysis/widgets/LineChartWidget.tsx`

Similar pattern, use `LineChart` from @mui/x-charts:
- `xAxis`: `[{ id: 'lineCategories', data: chartData.map(d => d.label), scaleType: 'point', label: widget.displayConfig.axisLabels?.x }]`
- `series`: `[{ data: chartData.map(d => d.value), label: widget.displayConfig.title, curve: 'linear' }]`

**File**: `frontend/src/components/analysis/widgets/HistogramWidget.tsx`

Use `BarChart` with histogram styling (same as BarChartWidget but different visual style).

### 3.3 Widget Renderer & Preview

**File**: `frontend/src/components/analysis/WidgetRenderer.tsx`

```typescript
import React from 'react';
import { Widget, WidgetType } from '../../types/widget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { BarChartWidget } from './widgets/BarChartWidget';
import { LineChartWidget } from './widgets/LineChartWidget';
import { HistogramWidget } from './widgets/HistogramWidget';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

export const WidgetRenderer: React.FC<{ widget: Widget }> = ({ widget }) => {
  const renderChart = () => {
    switch (widget.type) {
      case WidgetType.PIE: return <PieChartWidget widget={widget} />;
      case WidgetType.BAR: return <BarChartWidget widget={widget} />;
      case WidgetType.LINE: return <LineChartWidget widget={widget} />;
      case WidgetType.HISTOGRAM: return <HistogramWidget widget={widget} />;
      default: return <div>Unknown widget type</div>;
    }
  };

  return <WidgetErrorBoundary>{renderChart()}</WidgetErrorBoundary>;
};
```

**File**: `frontend/src/components/analysis/WidgetPreview.tsx`

```typescript
import React from 'react';
import { Box } from '@mui/material';
import { Widget } from '../../types/widget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { BarChartWidget } from './widgets/BarChartWidget';
import { LineChartWidget } from './widgets/LineChartWidget';
import { HistogramWidget } from './widgets/HistogramWidget';
import { WidgetType } from '../../types/widget';

export const WidgetPreview: React.FC<{ widget: Widget; preview?: boolean }> = ({ widget, preview = true }) => {
  const renderChart = () => {
    switch (widget.type) {
      case WidgetType.PIE: return <PieChartWidget widget={widget} preview={preview} />;
      case WidgetType.BAR: return <BarChartWidget widget={widget} preview={preview} />;
      case WidgetType.LINE: return <LineChartWidget widget={widget} preview={preview} />;
      case WidgetType.HISTOGRAM: return <HistogramWidget widget={widget} preview={preview} />;
      default: return <div>Unknown widget type</div>;
    }
  };

  return (
    <Box sx={{ width: '100%', height: preview ? '300px' : '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {renderChart()}
    </Box>
  );
};
```

### 3.4 Widget Card

**File**: `frontend/src/components/analysis/WidgetCard.tsx`

```typescript
import React from 'react';
import { Box, Card, CardContent, IconButton, Typography } from '@mui/material';
import { Visibility, Edit, Delete } from '@mui/icons-material';
import { Widget } from '../../types/widget';
import { WidgetRenderer } from './WidgetRenderer';
import { useWidgetStore } from '../../store/widgetStore';
import { format } from 'date-fns';

export const WidgetCard: React.FC<{ widget: Widget }> = ({ widget }) => {
  const { openEditModal, openDeleteModal, openPreviewExport } = useWidgetStore();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{widget.displayConfig.title}</Typography>
        <Box>
          <IconButton size="small" onClick={() => openPreviewExport(widget)} aria-label="Preview">
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openEditModal(widget)} aria-label="Edit">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => openDeleteModal(widget)} aria-label="Delete">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <WidgetRenderer widget={widget} />
      </CardContent>
      
      <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Created: {format(new Date(widget.createdAt), 'MMM dd, yyyy')}
        </Typography>
      </Box>
    </Card>
  );
};
```

---

## Phase 4: UI Components

### 4.1 Analysis Page

**File**: `frontend/src/pages/AnalysisPage.tsx`

```typescript
import React from 'react';
import { Box, Button, CircularProgress, Typography, TextField, IconButton, Grid } from '@mui/material';
import { Add, HelpOutline, Search as SearchIcon } from '@mui/icons-material';
import { useWidgets } from '../../hooks/analysis/useWidgets';
import { WidgetCard } from '../../components/analysis/WidgetCard';
import { useWidgetStore } from '../../store/widgetStore';
import { WidgetCreationWizard } from '../../components/analysis/WidgetCreationWizard';
import { EditWidgetModal } from '../../components/analysis/EditWidgetModal';
import { DeleteWidgetModal } from '../../components/analysis/DeleteWidgetModal';
import { PreviewExportModal } from '../../components/analysis/PreviewExportModal';
import { ConnectDataSourceModal } from '../../components/analysis/ConnectDataSourceModal';
import { HelpSupportModal } from '../../components/analysis/HelpSupportModal';

const AnalysisPage: React.FC = () => {
  const { data: widgets, isLoading, error } = useWidgets();
  const { openCreateWizard, openConnectDataSource, openHelpSupport } = useWidgetStore();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading widgets: {error?.message || 'Failed to load widgets'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Analysis Dashboard</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField placeholder="Search Clients" size="small" InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }} />
          <IconButton onClick={openHelpSupport}><HelpOutline /></IconButton>
          <Button variant="contained" startIcon={<Add />} onClick={openCreateWizard}>Create New Widget</Button>
        </Box>
      </Box>

      {/* Content */}
      {widgets && widgets.length > 0 ? (
        <Grid container spacing={3}>
          {widgets.map((widget) => (
            <Grid item xs={12} md={6} lg={4} key={widget.id}>
              <WidgetCard widget={widget} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>No widgets yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Add your first widget here to start visualizing your data.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openConnectDataSource}>
            Connect Data Source
          </Button>
        </Box>
      )}

      {/* Modals */}
      <WidgetCreationWizard />
      <EditWidgetModal />
      <DeleteWidgetModal />
      <PreviewExportModal />
      <ConnectDataSourceModal />
      <HelpSupportModal />
    </Box>
  );
};

export default AnalysisPage;
```

### 4.2 Create Widget Wizard

**File**: `frontend/src/components/analysis/WidgetCreationWizard.tsx`

```typescript
import React from 'react';
import { Dialog, DialogContent, Box, IconButton, Stepper, Step, StepLabel, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useWidgetStore } from '../../store/widgetStore';
import { WizardStep1ChooseType } from './wizard/WizardStep1ChooseType';
import { WizardStep2ConfigureData } from './wizard/WizardStep2ConfigureData';
import { WizardStep3PreviewGraph } from './wizard/WizardStep3PreviewGraph';
import { WizardStep4ReadyToCreate } from './wizard/WizardStep4ReadyToCreate';

const steps = ['Choose Widget Type', 'Configure Data & Options', 'Preview Graph', 'Ready to Create'];

export const WidgetCreationWizard: React.FC = () => {
  const { isCreateWizardOpen, closeCreateWizard, wizardState, setWizardStep } = useWidgetStore();
  const { step } = wizardState;

  const handleNext = () => {
    if (step < 4) setWizardStep((step + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    if (step > 1) setWizardStep((step - 1) as 1 | 2 | 3 | 4);
  };

  const renderStepContent = () => {
    switch (step) {
      case 1: return <WizardStep1ChooseType onNext={handleNext} />;
      case 2: return <WizardStep2ConfigureData onNext={handleNext} onBack={handleBack} />;
      case 3: return <WizardStep3PreviewGraph onNext={handleNext} onBack={handleBack} />;
      case 4: return <WizardStep4ReadyToCreate onBack={handleBack} />;
      default: return null;
    }
  };

  return (
    <Dialog open={isCreateWizardOpen} onClose={closeCreateWizard} maxWidth="lg" fullWidth>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Create New Widget</Typography>
        <IconButton onClick={closeCreateWizard} size="small"><Close /></IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <Stepper activeStep={step - 1} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent>{renderStepContent()}</DialogContent>
    </Dialog>
  );
};
```

**Wizard Step 1** (`WizardStep1ChooseType.tsx`): 2x2 Grid of MUI Cards for each WidgetType. On click, call `setWizardType(type)` and auto-advance to step 2.

**Wizard Step 2** (`WizardStep2ConfigureData.tsx`): 
- TextField for title (use `setWizardTitle`)
- Two TextField selects for X-Axis and Y-Axis (options: `['Date', 'Category', 'Product', 'Region']` and `['Revenue', 'Count', 'Percentage', 'Value']`)
- Checkboxes for Design Options (showLabels, showLegend, showGridLines)
- Next button disabled until title, xAxisField, yAxisField are filled

**Wizard Step 3** (`WizardStep3PreviewGraph.tsx`): 
- Create temporary widget object from `wizardState`:
```typescript
const previewWidget = {
  id: 'preview',
  type: wizardState.selectedType!,
  dataConfig: {
    source: 'invoices' as const,
    xAxisField: wizardState.xAxisField,
    yAxisField: wizardState.yAxisField,
  },
  displayConfig: {
    title: wizardState.title || 'Preview',
    showLabels: wizardState.showLabels,
    showLegend: wizardState.showLegend,
    showGridLines: wizardState.showGridLines,
    axisLabels: { x: wizardState.xAxisField, y: wizardState.yAxisField },
  },
};
```
- Render `<WidgetPreview widget={previewWidget} preview />` (note: preview won't fetch real data, just show structure)

**Wizard Step 4** (`WizardStep4ReadyToCreate.tsx`):
- Show CheckCircle icon
- Table with Type/Title/X-Axis/Y-Axis summary
- Save button that calls `useCreateWidget().mutateAsync()` with widget data from `wizardState`, then `closeCreateWizard()` and `resetWizard()`

### 4.3 Modals

All modals use MUI Dialog, managed via `widgetStore` modal flags.

**EditWidgetModal** (`frontend/src/components/analysis/EditWidgetModal.tsx`):
- Two-column layout (form left, preview right)
- Form: Title TextField, X-Axis/Y-Axis selects, Design Options checkboxes
- Preview: Use `WidgetPreview` with updated widget object (merge form state with `editingWidget`)
- Save button calls `useUpdateWidget().mutateAsync()`, then `closeEditModal()`

**DeleteWidgetModal** (`frontend/src/components/analysis/DeleteWidgetModal.tsx`):
- Simple confirmation dialog
- "No, Keep it" button → `closeDeleteModal()`
- "Yes, Delete" button → `useDeleteWidget().mutateAsync(deletingWidget.id)`, then `closeDeleteModal()`

**PreviewExportModal** (`frontend/src/components/analysis/PreviewExportModal.tsx`):
- Two-column: Full preview left (use `WidgetPreview`), export options right
- Format: 3x2 grid of buttons (PDF, PNG, JPEG, SVG, GIF, CSV)
- Resolution dropdown: ['1x', '2x', '3x']
- Colour dropdown: ['Standard', 'Grayscale', 'Dark']
- Download button (placeholder - just console.log for now)

**ConnectDataSourceModal** & **HelpSupportModal**: Placeholder implementations for now (UI only, no functionality).

---

## Phase 5: Integration & Polish

### 5.1 Grid Layout

**File**: `frontend/src/components/analysis/WidgetGrid.tsx`

Simple responsive grid using MUI Grid:

```typescript
import { Grid } from '@mui/material';
import { Widget } from '../../types/widget';
import { WidgetCard } from './WidgetCard';

export const WidgetGrid: React.FC<{ widgets: Widget[] }> = ({ widgets }) => (
  <Grid container spacing={3}>
    {widgets.map((widget) => (
      <Grid item xs={12} md={6} lg={4} key={widget.id}>
        <WidgetCard widget={widget} />
      </Grid>
    ))}
  </Grid>
);
```

### 5.2 Styling

Use Material-UI `sx` prop for styling. Create minimal SCSS modules only where needed (e.g., wizard step containers). Follow existing project styling patterns.

---

## Key Architecture Decisions

1. **Backend Data Aggregation**: Widget data fetched via `GET /widgets/:id/data`. Backend uses MongoDB aggregation pipelines. Frontend never does heavy data processing.

2. **React Query**: Handles caching, loading states, error handling automatically. No custom polling/flow_id system needed.

3. **Error Boundaries**: Each widget wrapped in error boundary so failures don't crash dashboard.

4. **No Microservices**: Keep it simple - monolith NestJS backend is sufficient.

5. **No DataSource Entities**: Frontend abstraction is enough. Don't store DataSource in DB.

---

## Implementation Checklist

### Backend
- [ ] Widget schema with plugins
- [ ] Repository interface & implementation
- [ ] DTOs (requests/responses)
- [ ] Widget service (CRUD)
- [ ] **Widget data service (MongoDB aggregation)**
- [ ] **Widget data endpoint (GET /widgets/:id/data)**
- [ ] Controller (full CRUD + data endpoint)
- [ ] Module setup & registration

### Frontend
- [ ] TypeScript types
- [ ] API client
- [ ] React Query hooks (`useWidgets`, `useWidgetData`, mutations)
- [ ] Widget store (Zustand - wizard + modal states)
- [ ] Error boundary component
- [ ] 4 widget components (Pie, Bar, Line, Histogram) using `useWidgetData`
- [ ] WidgetRenderer & WidgetPreview
- [ ] WidgetCard component
- [ ] AnalysisPage (dashboard layout)
- [ ] 4-step creation wizard
- [ ] 5 modals (Edit, Delete, Preview & Export, Connect Data Source, Help & Support)
- [ ] WidgetGrid component

### Testing
- [ ] Backend unit/integration tests
- [ ] Frontend component tests
- [ ] E2E tests for core flows

---

## Critical Implementation Details

### Field Mapping

**X-Axis Fields** (user selects) → **DB Fields**:
- `'Date'` → `'created_at'` (invoice creation date)
- `'Category'` → `'source'` (invoice source type)
- `'Product'` → `'name'` (invoice name/description)
- `'Region'` → `'country'` (from summary_content, may require join)

**Y-Axis Fields** (user selects) → **DB Fields**:
- `'Revenue'` → `'claim_amount'` (sum of claim amounts)
- `'Value'` → `'claim_amount'` (same as Revenue)
- `'Amount'` → `'claim_amount'` (same as Revenue)
- `'Count'` → Use `{ $sum: 1 }` (count documents)
- `'Percentage'` → Use `{ $sum: 1 }` (count, can calculate percentage later if needed)

**Note**: For fields that require summary data (like `country`), you may need to:
1. Join Invoice with Summary collection in aggregation pipeline, OR
2. Store commonly-used summary fields directly on Invoice document, OR
3. Fetch summary data separately and merge

### Data Flow

1. User creates widget → Frontend sends `CreateWidgetRequest` → Backend saves widget
2. User views dashboard → Frontend calls `GET /widgets` → Gets widget list
3. Widget renders → Frontend calls `GET /widgets/:id/data` → Backend aggregates data → Returns chart-ready data
4. React Query caches data → Subsequent renders use cached data until stale

### Wizard Preview Limitation

**Important**: Step 3 preview cannot fetch real data because widget doesn't exist yet. Options:
- Show mock/sample data structure
- Show empty chart with message "Preview will show data after creation"
- Create temporary widget in backend (not recommended - adds complexity)

Recommendation: Show chart structure with placeholder message.

## Notes

1. **Follow existing patterns**: Match Invoice/Profile/Chat feature structure exactly.
2. **Backend-first**: Always aggregate on backend, never in frontend. Frontend only displays.
3. **Error handling**: Use error boundaries, proper loading/error states. Widget failures shouldn't crash dashboard.
4. **Type safety**: Strict TypeScript, minimal `any`. Use proper types from schema.
5. **Field mapping**: Implement `mapXAxisFieldToDb` and `mapYAxisFieldToDb` based on actual Invoice/Summary schema fields.
6. **Account/Entity scoping**: Plugins handle this automatically. No manual filtering needed in repository.
7. **Keep it simple**: Don't over-engineer. Start with 4 widget types, add more later if needed.
