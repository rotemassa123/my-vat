import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, Min, Max, IsMongoId } from "class-validator";
import { Type, Transform } from "class-transformer";

// ==================== INVOICE FILTER REQUESTS ====================

export class InvoiceFilterRequest {
  @ApiProperty({ required: false, description: 'Filter by account ID', example: '635f8e5d1e2e3f2c9f8b4a5d' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  account_id?: string;

  @ApiProperty({ required: false, description: 'Filter by source ID (exact match)', example: 'invoice_001' })
  @IsOptional()
  @IsString()
  source_id?: string;

  @ApiProperty({ required: false, description: 'Filter by source type', example: 'upload' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false, description: 'Filter by processing status', example: 'completed' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Filter by content type (MIME type)', example: 'application/pdf' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiProperty({ required: false, description: 'Filter by execution step', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  last_executed_step?: number;

  @ApiProperty({ required: false, description: 'Filter by file name (contains)', example: 'invoice' })
  @IsOptional()
  @IsString()
  name_contains?: string;

  @ApiProperty({ required: false, description: 'Minimum file size in bytes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size_min?: number;

  @ApiProperty({ required: false, description: 'Maximum file size in bytes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  size_max?: number;

  @ApiProperty({ required: false, description: 'Created after this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  created_at_from?: Date;

  @ApiProperty({ required: false, description: 'Created before this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  created_at_to?: Date;

  @ApiProperty({ required: false, description: 'Status updated after this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  status_updated_at_from?: Date;

  @ApiProperty({ required: false, description: 'Status updated before this date (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  status_updated_at_to?: Date;
}

export class InvoicePaginationRequest {
  @ApiProperty({ required: false, description: 'Number of items to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000)
  limit?: number = 50;

  @ApiProperty({ required: false, description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}


// ==================== COMBINED REQUESTS ====================

export class CombinedInvoiceFilterRequest {
  @ApiProperty({ required: false, description: 'Account ID (ignored, scoping automatic)', example: '635f8e5d1e2e3f2c9f8b4a5d' })
  @IsOptional()
  @IsString()
  @IsMongoId()
  account_id?: string;

  // Pagination properties
  @ApiProperty({ required: false, description: 'Number of items to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5000)
  limit?: number = 50;

  @ApiProperty({ required: false, description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
} 