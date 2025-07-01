import { ApiProperty } from "@nestjs/swagger";
import { SummaryContent } from "../../../Common/Infrastructure/DB/schemas/summary.schema";

// ==================== INVOICE RESPONSES ====================

export class InvoiceResponse {
  @ApiProperty({ description: 'Unique invoice ID' })
  _id: string;

  @ApiProperty({ description: 'Account ID that owns this invoice' })
  account_id: number;

  @ApiProperty({ description: 'Original file name' })
  name: string;

  @ApiProperty({ description: 'External source ID (e.g., Google Drive ID)' })
  source_id: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Last processing step executed' })
  last_executed_step: number;

  @ApiProperty({ description: 'Source type (e.g., google_drive)' })
  source: string;

  @ApiProperty({ description: 'MIME content type' })
  content_type: string;

  @ApiProperty({ description: 'Current processing status' })
  status: string;

  @ApiProperty({ description: 'Error reason if processing failed', nullable: true })
  reason?: string | null;

  @ApiProperty({ description: 'VAT claim amount if processed', nullable: true })
  claim_amount?: number | null;

  @ApiProperty({ description: 'Date when claim was submitted', nullable: true })
  claim_submitted_at?: Date | null;

  @ApiProperty({ description: 'Date when claim result was received', nullable: true })
  claim_result_received_at?: Date | null;

  @ApiProperty({ description: 'Last status update timestamp' })
  status_updated_at: Date;

  @ApiProperty({ description: 'Invoice creation timestamp' })
  created_at: Date;
}

export class InvoiceListResponse {
  @ApiProperty({ description: 'List of invoices matching the filters', type: [InvoiceResponse] })
  data: InvoiceResponse[];

  @ApiProperty({ description: 'Pagination and filter metadata' })
  metadata: {
    total: number;
    limit: number;
    skip: number;
    count: number;
  };
}

// ==================== SUMMARY RESPONSES ====================

export class SummaryResponse {
  @ApiProperty({ description: 'Unique summary ID' })
  _id: string;

  @ApiProperty({ description: 'Account ID that owns this summary' })
  account_id: number;

  @ApiProperty({ description: 'Reference to the original file ID' })
  file_id: string;

  @ApiProperty({ description: 'Original file name' })
  file_name: string;

  @ApiProperty({ description: 'Whether the file was classified as an invoice' })
  is_invoice: boolean;

  @ApiProperty({ description: 'Structured summary content from AI processing' })
  summary_content: SummaryContent;

  @ApiProperty({ description: 'Time taken to process in seconds', nullable: true })
  processing_time_seconds?: number;

  @ApiProperty({ description: 'Whether processing was successful' })
  success: boolean;

  @ApiProperty({ description: 'Error message if processing failed', nullable: true })
  error_message?: string | null;

  @ApiProperty({ description: 'Summary creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Raw analysis result from AI processing', nullable: true })
  analysis_result?: any;

  @ApiProperty({ description: 'Structured extracted data', nullable: true })
  extracted_data?: any;

  @ApiProperty({ description: 'AI confidence score (0-1)', nullable: true })
  confidence_score?: number;

  @ApiProperty({ description: 'Processing status', nullable: true })
  processing_status?: string;

  @ApiProperty({ description: 'Extracted VAT amount', nullable: true })
  vat_amount?: number;

  @ApiProperty({ description: 'Total invoice amount', nullable: true })
  total_amount?: number;

  @ApiProperty({ description: 'Currency code', nullable: true })
  currency?: string;

  @ApiProperty({ description: 'Vendor/supplier name', nullable: true })
  vendor_name?: string;

  @ApiProperty({ description: 'Invoice date from document', nullable: true })
  invoice_date?: Date;

  @ApiProperty({ description: 'Invoice number from document', nullable: true })
  invoice_number?: string;
}

export class SummaryListResponse {
  @ApiProperty({ description: 'List of summaries matching the filters', type: [SummaryResponse] })
  data: SummaryResponse[];

  @ApiProperty({ description: 'Pagination and filter metadata' })
  metadata: {
    total: number;
    limit: number;
    skip: number;
    count: number;
  };
}

export class CombinedInvoiceResponse {
  // Core invoice fields
  @ApiProperty({ description: 'Unique invoice ID' })
  _id: string;

  @ApiProperty({ description: 'Account ID that owns this invoice' })
  account_id: number;

  @ApiProperty({ description: 'Original file name' })
  name: string;

  @ApiProperty({ description: 'External source ID (e.g., Google Drive ID)' })
  source_id: string;

  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @ApiProperty({ description: 'Last processing step executed' })
  last_executed_step: number;

  @ApiProperty({ description: 'Source type (e.g., google_drive)' })
  source: string;

  @ApiProperty({ description: 'Current processing status' })
  status: string;

  @ApiProperty({ description: 'Error reason if processing failed', nullable: true })
  reason?: string | null;

  @ApiProperty({ description: 'VAT claim amount if processed', nullable: true })
  claim_amount?: number | null;

  @ApiProperty({ description: 'Date when claim was submitted', nullable: true })
  claim_submitted_at?: Date | null;

  @ApiProperty({ description: 'Date when claim result was received', nullable: true })
  claim_result_received_at?: Date | null;

  @ApiProperty({ description: 'Last status update timestamp' })
  status_updated_at: Date;

  @ApiProperty({ description: 'Invoice creation timestamp' })
  created_at: Date;

  // Summary metadata fields
  @ApiProperty({ description: 'Whether the file was classified as an invoice', nullable: true })
  is_invoice?: boolean;

  @ApiProperty({ description: 'Time taken to process in seconds', nullable: true })
  processing_time_seconds?: number;

  @ApiProperty({ description: 'Whether processing was successful', nullable: true })
  success?: boolean;

  @ApiProperty({ description: 'Error message if processing failed', nullable: true })
  error_message?: string | null;

  @ApiProperty({ description: 'AI confidence score (0-1)', nullable: true })
  confidence_score?: number;

  // Flattened summary content fields (extracted data)
  @ApiProperty({ description: 'Country from invoice', nullable: true })
  country?: string;

  @ApiProperty({ description: 'Supplier name from invoice', nullable: true })
  supplier?: string;

  @ApiProperty({ description: 'Invoice date from document', nullable: true })
  invoice_date?: string;

  @ApiProperty({ description: 'Invoice number from document', nullable: true })
  invoice_number?: string;

  @ApiProperty({ description: 'Invoice description', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Net amount from invoice', nullable: true })
  net_amount?: string;

  @ApiProperty({ description: 'VAT amount from invoice', nullable: true })
  vat_amount?: string;

  @ApiProperty({ description: 'VAT rate from invoice', nullable: true })
  vat_rate?: string;

  @ApiProperty({ description: 'Currency code', nullable: true })
  currency?: string;

  // Computed fields
  @ApiProperty({ description: 'Vendor/supplier name (computed)', nullable: true })
  vendor_name?: string;

  @ApiProperty({ description: 'Total invoice amount (computed)', nullable: true })
  total_amount?: number;
}

export class CombinedInvoiceListResponse {
  @ApiProperty({ description: 'List of combined invoices with summary data', type: [CombinedInvoiceResponse] })
  data: CombinedInvoiceResponse[];

  @ApiProperty({ description: 'Pagination metadata' })
  metadata: {
    total: number;
    limit: number;
    skip: number;
    count: number;
  };
} 