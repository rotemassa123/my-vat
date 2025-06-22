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

// Invoice related types
export interface Invoice {
  id: string;
  file_name: string;
  file_size: number;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'submitted' | 'approved' | 'rejected';
  account_id: string;
  
  // VAT related fields
  invoice_number?: string;
  supplier_name?: string;
  supplier_vat_number?: string;
  invoice_date?: string;
  currency?: string;
  net_amount?: number;
  vat_amount?: number;
  total_amount?: number;
  vat_rate?: number;
  vat_scheme?: string;
  
  // Claim related fields
  claimant?: string;
  submitted_date?: string;
  claim_amount?: number;
  refund_amount?: number;
  
  // Processing fields
  processed_at?: string;
  error_message?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface InvoiceFilters {
  status?: string[];
  claimant?: string;
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