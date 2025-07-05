import { UserType } from "src/Common/consts/userType";

// Account Responses
export interface AccountResponse {
  _id: string;
  email: string;
  account_type: string;
  status: string;
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
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAccountResponse {
  _id: string;
}

// Entity Responses
export interface EntityResponse {
  _id: string;
  accountId: string;
  name: string;
  entity_type?: string;
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
    filing_frequency?: string;
  };
  status: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateEntityResponse {
  _id: string;
}

// User Responses
export interface UserResponse {
  _id: string;
  fullName: string;
  email: string;
  userType: UserType;
  accountId: string;
  status: string;
  last_login?: Date;
  profile_image_url?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserResponse {
  _id: string;
}

// Combined Profile Response
export interface CombinedProfileResponse {
  user: UserResponse;
  account: AccountResponse;
  entities: EntityResponse[];
} 