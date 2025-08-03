export interface ReportingFilters {
  // Multi-select filters
  status?: string[];
  vat_scheme?: string[];
  currency?: string[];
}

export interface ReportingSortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export interface ReportingQueryParams extends ReportingFilters {
  limit?: number;
  skip?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  include_summary?: boolean;  // New parameter for including embedded summaries
}

export interface SummaryContent {
  country?: string;
  supplier?: string;
  date?: string;
  id?: string;
  description?: string;
  net_amount?: string;
  vat_amount?: string;
  vat_rate?: string;
  currency?: string;
}

export interface ReportingInvoice {
  _id: string;
  name: string;
  supplier?: string;
  entity_id?: string;
  entity_name?: string; // Add entity name field
  invoice_date?: string;
  invoice_number?: string;
  net_amount?: string;
  vat_amount?: string;
  currency?: string;
  status: string;
  created_at: string;
  confidence_score?: number;
  country?: string;
  description?: string;
  vat_rate?: string;
  vat_scheme?: string;  // Added VAT scheme field
  claim_amount?: number;
  size: number;
  source: string;
  error_message?: string;
  is_invoice?: boolean;
  status_updated_at: string;
  total_amount?: number;
  vendor_name?: string;
  supplier_name?: string;  // Added supplier name field for compatibility
  summary_content?: SummaryContent;  // Embedded summary data
}

export interface ReportingMetadata {
  total: number;
  limit: number;
  skip: number;
  count: number;
  user_scope: {
    account_id: string;
    entity_id?: string;
    user_type: string;
  };
  cache_hit: boolean;
}

export interface ReportingResponse {
  data: ReportingInvoice[];
  metadata: ReportingMetadata;
}

export interface ReportingPageData {
  data: ReportingInvoice[];
  metadata: ReportingMetadata;
}

export const SORTABLE_FIELDS = [
  'created_at',
  'invoice_date',
  'status_updated_at',
  'net_amount',
  'vat_amount',
  'supplier',
  'status',
  'currency',
  'name',
  'invoice_number',
] as const;

export type SortableField = typeof SORTABLE_FIELDS[number];

export const FILTER_OPTIONS = {
  status: [
    'processing',
    'completed',
    'failed',
    'claimable',
    'pending',
    'error',
  ],
  vat_scheme: [
    'standard',
    'reduced',
    'zero',
    'exempt',
    'reverse_charge',
    'margin_scheme',
    'import_vat',
    'export_vat',
  ],
  currency: [
    'EUR',
    'USD',
    'GBP',
    'ILS',
  ],
} as const; 