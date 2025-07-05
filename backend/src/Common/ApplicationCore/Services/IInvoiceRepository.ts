// ==================== INVOICE TYPES ====================
export interface InvoiceData {
  _id?: string;
  account_id: string;
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
  account_id?: string;
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
  account_id: string;
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
  account_id?: string;
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
  // Core invoice fields
  _id: string;
  account_id: string;
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
  
  // Summary metadata fields
  is_invoice?: boolean;
  processing_time_seconds?: number;
  success?: boolean;
  error_message?: string | null;
  confidence_score?: number;
  
  // Flattened summary content fields (extracted data)
  country?: string;
  supplier?: string;
  invoice_date?: string;
  invoice_number?: string;
  description?: string;
  net_amount?: string;
  vat_amount?: string;
  vat_rate?: string;
  currency?: string;
  
  // Computed fields
  vendor_name?: string;
  total_amount?: number;
}

export interface CombinedInvoiceFilters {
  // Account ID is optional – scoping applied automatically
  account_id?: string;
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