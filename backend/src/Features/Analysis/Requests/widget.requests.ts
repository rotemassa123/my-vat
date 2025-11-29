import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString, IsOptional, IsBoolean, ValidateNested, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout, LayoutPosition, AxisConfig, AggregationType, TimeGrouping, WidgetFilters } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export class WidgetDataConfigDto implements WidgetDataConfig {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  xAxisField?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  yAxisField?: string;

  @ApiPropertyOptional({ enum: AggregationType })
  @IsOptional()
  @IsEnum(AggregationType)
  aggregation?: AggregationType;

  @ApiPropertyOptional({ enum: TimeGrouping })
  @IsOptional()
  @IsEnum(TimeGrouping)
  timeGrouping?: TimeGrouping;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  filters?: WidgetFilters;
}

export class AxisConfigDto implements AxisConfig {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  format?: string;
}

export class WidgetDisplayConfigDto implements WidgetDisplayConfig {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

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
  @ValidateNested()
  @Type(() => Object)
  axisLabels?: {
    x?: AxisConfigDto;
    y?: AxisConfigDto;
  };
}

export class LayoutPositionDto implements LayoutPosition {
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

export class WidgetLayoutDto implements WidgetLayout {
  @ApiPropertyOptional({ type: LayoutPositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutPositionDto)
  '4'?: LayoutPositionDto;

  @ApiPropertyOptional({ type: LayoutPositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutPositionDto)
  '6'?: LayoutPositionDto;

  @ApiPropertyOptional({ type: LayoutPositionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutPositionDto)
  '8'?: LayoutPositionDto;
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

