import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

