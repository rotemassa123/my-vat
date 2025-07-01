// ==================== INVOICE TYPES ====================
export interface InvoiceData {
  _id?: string;
  account_id: number;
  name: string;
  source_id: string;
  size: number;
  last_executed_step: number;
  source: string;
  content_type: string;
  status: string;
  reason?: string | null;
  claim_amount?: number | null;
  claim_submitted_at?: Date | null;
  claim_result_received_at?: Date | null;
  status_updated_at: Date;
  created_at?: Date;
}

export interface InvoiceFilters {
  account_id?: number;
  source_id?: string;
  source?: string;
  status?: string;
  content_type?: string;
  last_executed_step?: number;
  created_at_from?: Date;
  created_at_to?: Date;
  status_updated_at_from?: Date;
  status_updated_at_to?: Date;
  size_min?: number;
  size_max?: number;
  name_contains?: string;
}

// ==================== SUMMARY TYPES ====================
import { SummaryContent } from "../../Infrastructure/DB/schemas/summary.schema";

export interface SummaryData {
  _id?: string;
  account_id: number;
  file_id: string;
  file_name: string;
  is_invoice: boolean;
  summary_content: SummaryContent;
  processing_time_seconds?: number;
  success: boolean;
  error_message?: string | null;
  created_at?: Date;
  analysis_result?: any;
  extracted_data?: any;
  confidence_score?: number;
  processing_status?: string;
  vat_amount?: number;
  total_amount?: number;
  currency?: string;
  vendor_name?: string;
  invoice_date?: Date;
  invoice_number?: string;
}

export interface SummaryFilters {
  account_id?: number;
  file_id?: string;
  is_invoice?: boolean;
  processing_status?: string;
  confidence_score_min?: number;
  confidence_score_max?: number;
  vat_amount_min?: number;
  vat_amount_max?: number;
  total_amount_min?: number;
  total_amount_max?: number;
  currency?: string;
  vendor_name_contains?: string;
  invoice_date_from?: Date;
  invoice_date_to?: Date;
  created_at_from?: Date;
  created_at_to?: Date;
}

export interface CombinedInvoiceData {
  _id: string;
  account_id: number;
  name: string;
  source_id: string;
  size: number;
  last_executed_step: number;
  source: string;
  status: string;
  reason?: string | null;
  claim_amount?: number | null;
  claim_submitted_at?: Date | null;
  claim_result_received_at?: Date | null;
  status_updated_at: Date;
  created_at: Date;
  
  // Summary fields (spread from summary)
  analysis_result?: any;
  confidence_score?: number;
  processing_status?: string;
  vat_amount?: number;
  total_amount?: number;
  currency?: string;
  vendor_name?: string;
  invoice_date?: Date;
  invoice_number?: string;
}

export interface CombinedInvoiceFilters extends InvoiceFilters {
  vendor_name?: string;           // Claimant
  claim_submitted_at_from?: Date; // Submitted date from
  claim_submitted_at_to?: Date;   // Submitted date to
  currency?: string;             // Currency
  invoice_date_from?: Date;      // Invoice date from
  invoice_date_to?: Date;        // Invoice date to
  // Note: status is inherited from InvoiceFilters
}

export interface PaginatedCombinedResult {
  data: CombinedInvoiceData[];
  total: number;
  limit: number;
  skip: number;
  count: number;
}

// ==================== INVOICE REPOSITORY INTERFACE ====================
export abstract class IInvoiceRepository {
  // Invoice methods
  abstract findInvoices(filters: InvoiceFilters, limit?: number, skip?: number): Promise<InvoiceData[]>;
  abstract findInvoiceById(id: string): Promise<InvoiceData | null>;
  abstract countInvoices(filters: InvoiceFilters): Promise<number>;

  // Summary methods  
  abstract findSummaries(filters: SummaryFilters, limit?: number, skip?: number): Promise<SummaryData[]>;
  abstract findSummaryById(id: string): Promise<SummaryData | null>;
  abstract findSummaryByFileId(fileId: string): Promise<SummaryData | null>;
  abstract countSummaries(filters: SummaryFilters): Promise<number>;

  // Combined methods
  abstract findCombinedInvoices(filters: CombinedInvoiceFilters, limit?: number, skip?: number): Promise<PaginatedCombinedResult>;
} 