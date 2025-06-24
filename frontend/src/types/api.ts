// Base response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
  has_next: boolean;
  has_prev: boolean;
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

// Invoice related types - matches the API response structure
export interface Invoice {
  id: string;
  file_name: string;
  invoice_id?: string | null;
  vat_scheme?: string | null;
  submitted_date?: string;
  currency?: string | null;
  claim_amount?: string | null;
  status: InvoiceStatus;
  refund_amount?: string | null;
  supplier?: string | null;
  invoice_date?: string | null;
  net_amount?: string | null;
  vat_rate?: string | null;
  created_at: string;
  processing_status?: string;
  reason?: string;           // Reason for failed/not_claimable status
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
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// Summary types
export interface Summary {
  id: string;
  invoice_id: string;
  content: string;
  confidence_score: number;
  extracted_fields: Record<string, any>;
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