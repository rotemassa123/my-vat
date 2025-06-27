export interface AccountData {
  _id?: string;
  email: string;
  name: string;
  account_type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  website?: string;
  vat_settings: {
    default_currency: string;
    vat_rate: number;
    reclaim_threshold: number;
    auto_process: boolean;
  };
  password_hash: string;
  google_user_id?: string;
  auth_providers: string[];
  last_login?: Date;
  monthly_upload_limit_mb: number;
  current_month_usage_mb: number;
  permissions: string[];
  verified_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAccountData {
  email: string;
  name: string;
  account_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  website?: string;
  vat_settings?: {
    default_currency: string;
    vat_rate: number;
    reclaim_threshold: number;
    auto_process: boolean;
  };
  password_hash: string;
  google_user_id?: string;
  auth_providers?: string[];
  monthly_upload_limit_mb?: number;
  permissions?: string[];
}

export interface UpdateAccountData {
  email?: string;
  name?: string;
  account_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  website?: string;
  vat_settings?: {
    default_currency?: string;
    vat_rate?: number;
    reclaim_threshold?: number;
    auto_process?: boolean;
  };
  password_hash?: string;
  google_user_id?: string;
  auth_providers?: string[];
  last_login?: Date;
  monthly_upload_limit_mb?: number;
  current_month_usage_mb?: number;
  permissions?: string[];
  verified_at?: Date;
}

export abstract class IAccountRepository {
  abstract findAccountById(accountId: string): Promise<AccountData | null>;
  abstract findAccountByEmail(email: string): Promise<AccountData | null>;
  abstract createAccount(accountData: CreateAccountData): Promise<AccountData>;
  abstract updateAccount(accountId: string, updateData: UpdateAccountData): Promise<boolean>;
  abstract deleteAccount(accountId: string): Promise<boolean>;
  abstract accountExists(accountId: string): Promise<boolean>;
} 