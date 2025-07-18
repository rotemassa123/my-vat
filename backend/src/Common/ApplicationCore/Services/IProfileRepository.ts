import { UserType } from "src/Common/consts/userType";

// ==================== ACCOUNT TYPES ====================
export interface AccountData {
  _id: string;
  email: string;
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
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAccountData {
  email: string;
  account_type?: 'individual' | 'business';
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
}

export interface UpdateAccountData {
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
  last_login?: Date;
}

// ==================== USER TYPES ====================
export interface UserData {
  _id: string;
  fullName: string;
  email: string;
  hashedPassword?: string;
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

export interface CreateUserData {
  fullName: string;
  email: string;
  hashedPassword?: string;
  userType: UserType;
  accountId?: string;
  entityId?: string;
  phone?: string;
  profile_image_url?: string;
  status?: 'active' | 'inactive' | 'pending' | 'failed to send request';
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  hashedPassword?: string;
  userType?: UserType;
  accountId?: string;
  entityId?: string;
  status?: string;
  last_login?: Date;
  profile_image_url?: string;
  phone?: string;
}

// ==================== ENTITY TYPES ====================
export interface EntityData {
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

export interface CreateEntityData {
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
  description?: string;
}

export interface UpdateEntityData {
  name?: string;
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
  status?: 'active' | 'inactive' | 'dissolved';
  description?: string;
}

// ==================== COMBINED REPOSITORY INTERFACE ====================
export abstract class IProfileRepository {
  // Account methods
  abstract findAccountById(accountId: string): Promise<AccountData | null>;
  abstract findAccountByEmail(email: string): Promise<AccountData | null>;
  abstract createAccount(accountData: CreateAccountData): Promise<AccountData>;
  abstract updateAccount(accountId: string, updateData: UpdateAccountData): Promise<boolean>;
  abstract deleteAccount(accountId: string): Promise<boolean>;
  abstract accountExists(accountId: string): Promise<boolean>;

  // User methods
  abstract findUserById(userId: string): Promise<UserData | null>;
  abstract findUserByEmail(email: string): Promise<UserData | null>;
  abstract createUser(userData: CreateUserData): Promise<UserData>;
  abstract createUsersBatch(usersData: CreateUserData[]): Promise<UserData[]>;
  abstract updateUser(userId: string, updateData: UpdateUserData): Promise<boolean>;
  abstract deleteUser(userId: string): Promise<boolean>;
  abstract userExists(userId: string): Promise<boolean>;
  abstract userExistsByEmail(email: string): Promise<boolean>;
  abstract getUsersForAccount(): Promise<UserData[]>;

  // Entity methods
  abstract findEntityById(entityId: string): Promise<EntityData | null>;
  abstract getEntitiesForAccount(): Promise<EntityData[]>;
  abstract createEntity(entityData: CreateEntityData): Promise<EntityData>;
  abstract updateEntity(entityId: string, updateData: UpdateEntityData): Promise<boolean>;
  abstract deleteEntity(entityId: string): Promise<boolean>;
  abstract entityExists(entityId: string): Promise<boolean>;
} 