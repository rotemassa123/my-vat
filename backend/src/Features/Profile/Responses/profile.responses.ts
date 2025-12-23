import { UserType } from "src/Common/consts/userType";

// Account Responses
export interface AccountResponse {
  _id: string;
  account_type: string;
  status: string;
  company_name?: string;
  description?: string;
  website?: string;
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
  entity_type: string;
  status: string;
  entity_name?: string;
  description?: string;
  website?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
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
  accountId?: string;
  entityId?: string;
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

export interface StatisticsResponse {
  entity_id: string;
  data: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

// Combined Profile Response
export interface CombinedProfileResponse {
  user: UserResponse;
  account: AccountResponse;
  entities: EntityResponse[];
} 
// Comprehensive Profile Response based on user type
export interface ComprehensiveProfileResponse {
  account?: AccountResponse;
  entities?: EntityResponse[];
  users?: UserResponse[];
  statistics?: StatisticsResponse[];
}
