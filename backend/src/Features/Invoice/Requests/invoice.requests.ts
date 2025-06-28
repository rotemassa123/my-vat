import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, Min, Max } from "class-validator";
import { Type, Transform } from "class-transformer";

// ==================== INVOICE FILTER REQUESTS ====================

export class InvoiceFilterRequest {
  @ApiProperty({ required: false, description: 'Filter by account ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  account_id?: number;

  @ApiProperty({ required: false, description: 'Filter by source ID (exact match)' })
  @IsOptional()
  @IsString()
  source_id?: string;

  @ApiProperty({ required: false, description: 'Filter by source type' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false, description: 'Filter by processing status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Filter by content type (MIME type)' })
  @IsOptional()
  @IsString()
  content_type?: string;

  @ApiProperty({ required: false, description: 'Filter by execution step' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  last_executed_step?: number;

  @ApiProperty({ required: false, description: 'Filter by file name (contains)' })
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
  @Max(1000)
  limit?: number = 50;

  @ApiProperty({ required: false, description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
}

// ==================== SUMMARY FILTER REQUESTS ====================

export class SummaryFilterRequest {
  @ApiProperty({ required: false, description: 'Filter by account ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  account_id?: number;

  @ApiProperty({ required: false, description: 'Filter by file ID (exact match)' })
  @IsOptional()
  @IsString()
  file_id?: string;

  @ApiProperty({ required: false, description: 'Filter by invoice classification' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_invoice?: boolean;

  @ApiProperty({ required: false, description: 'Filter by processing status' })
  @IsOptional()
  @IsString()
  processing_status?: string;

  @ApiProperty({ required: false, description: 'Filter by currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, description: 'Filter by vendor name (contains)' })
  @IsOptional()
  @IsString()
  vendor_name_contains?: string;

  @ApiProperty({ required: false, description: 'Minimum confidence score (0-1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score_min?: number;

  @ApiProperty({ required: false, description: 'Maximum confidence score (0-1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence_score_max?: number;

  @ApiProperty({ required: false, description: 'Minimum VAT amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vat_amount_min?: number;

  @ApiProperty({ required: false, description: 'Maximum VAT amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  vat_amount_max?: number;

  @ApiProperty({ required: false, description: 'Minimum total amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount_min?: number;

  @ApiProperty({ required: false, description: 'Maximum total amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount_max?: number;

  @ApiProperty({ required: false, description: 'Invoice date from (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  invoice_date_from?: Date;

  @ApiProperty({ required: false, description: 'Invoice date to (ISO string)' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  invoice_date_to?: Date;

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
}

export class SummaryPaginationRequest {
  @ApiProperty({ required: false, description: 'Number of items to return', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @ApiProperty({ required: false, description: 'Number of items to skip', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;
} 