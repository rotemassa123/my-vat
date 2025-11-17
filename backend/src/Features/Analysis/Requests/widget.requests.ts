import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString, IsOptional, IsBoolean, ValidateNested, IsArray, IsNumber } from 'class-validator';
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
  filters?: {
    dateRange?: { start: Date; end: Date };
    entityIds?: string[];
    [key: string]: any;
  };
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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  axisLabels?: { x?: string; y?: string };
}

export class WidgetLayoutDto implements WidgetLayout {
  @ApiProperty()
  @IsNumber()
  x: number;
  
  @ApiProperty()
  @IsNumber()
  y: number;
  
  @ApiProperty()
  @IsNumber()
  w: number;
  
  @ApiProperty()
  @IsNumber()
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

