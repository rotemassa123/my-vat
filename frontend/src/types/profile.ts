import { type User } from './user';

export interface Account {
  _id: string;
  account_type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  description?: string;
  website?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Entity {
  _id: string;
  accountId: string;
  name: string;
  entity_type?: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';
  registration_number?: string;
  incorporation_date?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };
  status: 'active' | 'inactive' | 'dissolved';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Statistics - entity_id is required since every Statistics document has one
export interface Statistics {
  entity_id: string;
  data: Record<string, any>;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface ComprehensiveProfile {
  account?: Account;
  entities?: Entity[];
  users?: User[];
  statistics?: Statistics[];
} 