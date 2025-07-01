// Base response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  metadata: {
    total: number;
    limit: number;
    skip: number;
    count: number;
  };
}

// Invoice status enum matching backend
export type InvoiceStatus = 
  | 'processing'              // During discovery, upload, summarize, eligibility check
  | 'failed'                  // Processing failed for some reason
  | 'not_claimable'          // Determined to be not claimable
  | 'claimable'              // Claimable but not yet submitted
  | 'awaiting_claim_result'  // Claim submitted, waiting for result
  | 'claim_accepted'         // Claim was accepted
  | 'claim_rejected';        // Claim was rejected

// Invoice related types - matches the CombinedInvoiceResponse structure from backend
export interface Invoice {
  // Core invoice fields
  _id: string;
  account_id: number;
  name: string;
  source_id: string;
  size: number;
  last_executed_step: number;
  source: string;
  status: InvoiceStatus;
  reason?: string | null;
  claim_amount?: number | null;
  claim_submitted_at?: string | null;
  claim_result_received_at?: string | null;
  status_updated_at: string;
  created_at: string;
  
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

export interface InvoiceFilters {
  status?: string[];
  filename?: string;
  vat_scheme?: string;
  currency?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface InvoiceQueryParams extends InvoiceFilters {
  limit?: number;
  skip?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Summary types
export interface Summary {
  id: string;
  invoice_id: string;
  content: string;
  confidence_score: number;
  extracted_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Account types
export interface Account {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
  vat_settings: {
    default_currency: string;
    vat_schemes: string[];
    entities: string[];
  };
  created_at: string;
  updated_at: string;
} 