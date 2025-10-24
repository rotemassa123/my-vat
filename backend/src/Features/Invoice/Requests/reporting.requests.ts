import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, Min, Max, IsArray, IsIn, IsBoolean } from "class-validator";
import { Type } from "class-transformer";

export class ReportingQueryRequest {
  // Pagination
  @ApiProperty({ required: false, description: 'Number of items to return', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;

  @ApiProperty({ required: false, description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  // Sorting
  @ApiProperty({ 
    required: false, 
    description: 'Field to sort by',
    enum: ['created_at', 'invoice_date', 'status_updated_at', 'net_amount', 'vat_amount', 'supplier', 'status', 'currency'],
    default: 'created_at'
  })
  @IsOptional()
  @IsString()
  @IsIn(['created_at', 'invoice_date', 'status_updated_at', 'net_amount', 'vat_amount', 'supplier', 'status', 'currency', 'name', 'invoice_number'])
  sort_by?: string = 'created_at';

  @ApiProperty({ required: false, description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';

  // Multi-select filters
  @ApiProperty({ required: false, description: 'Filter by status values', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiProperty({ required: false, description: 'Filter by VAT schemes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vat_scheme?: string[];

  @ApiProperty({ required: false, description: 'Filter by currencies', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currency?: string[];
} 