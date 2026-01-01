
import { UserRole } from "src/Common/consts/userRole";

// ==================== ACCOUNT TYPES ====================
export interface AccountData {
  _id: string;
  account_type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  description?: string;
  website?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateAccountData {
  account_type?: 'individual' | 'business';
  company_name?: string;
  description?: string;
  website?: string;
}

export interface UpdateAccountData {
  account_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  description?: string;
  website?: string;
}

// ==================== USER TYPES ====================
export interface UserData {
  _id: string;
  full_name?: string;
  email: string;
  hashed_password: string;
  role: UserRole;
  accountId?: string;
  entityId?: string;
  status: string;
  last_login_at?: Date;
  profile_image_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateUserData {
  full_name?: string;
  email: string;
  hashed_password: string;
  role: UserRole;
  accountId?: string;
  entityId?: string;
  profile_image_url?: string;
  status?: 'active' | 'inactive' | 'pending' | 'failed to send request';
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  hashed_password?: string;
  role?: UserRole;
  accountId?: string;
  entityId?: string;
  status?: string;
  last_login_at?: Date;
  profile_image_url?: string;
}

// ==================== ENTITY TYPES ====================
export type EntityType = 'individual' | 'business' | 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';

export interface EntityData {
  _id: string;
  accountId: string;
  entity_type: EntityType;
  status: 'active' | 'inactive';
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

export interface CreateEntityData {
  accountId: string;
  entity_type?: EntityType;
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
}

export interface UpdateEntityData {
  entity_type?: EntityType;
  status?: 'active' | 'inactive';
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
}

// ==================== COMBINED REPOSITORY INTERFACE ====================
export abstract class IProfileRepository {
  // Account methods
  abstract findAccountById(accountId: string): Promise<AccountData | null>;
  abstract getAllAccounts(): Promise<AccountData[]>;
  abstract createAccount(accountData: CreateAccountData): Promise<AccountData>;
  abstract updateAccount(accountId: string, updateData: UpdateAccountData): Promise<boolean>;
  abstract deleteAccount(accountId: string): Promise<boolean>;
  abstract accountExists(accountId: string): Promise<boolean>;

  // User methods
  abstract findUserById(userId: string): Promise<UserData | null>;
  abstract findUserByEmail(email: string): Promise<UserData | null>;
  abstract findUsersByEmails(emails: string[]): Promise<UserData[]>;
  abstract createUser(userData: CreateUserData): Promise<UserData>;
  abstract createUsersBatch(usersData: CreateUserData[]): Promise<UserData[]>;
  abstract updateUser(userId: string, updateData: UpdateUserData): Promise<boolean>;
  abstract deleteUser(userId: string): Promise<boolean>;
  abstract userExists(userId: string): Promise<boolean>;
  abstract userExistsByEmail(email: string): Promise<boolean>;
  abstract getUsersForAccount(): Promise<UserData[]>;
  abstract getUsersForAccountId(accountId: string): Promise<UserData[]>;

  // Entity methods
  abstract findEntityById(entityId: string): Promise<EntityData | null>;
  abstract getEntitiesForAccount(): Promise<EntityData[]>;
  abstract getAllEntities(): Promise<EntityData[]>;
  abstract createEntity(entityData: CreateEntityData): Promise<EntityData>;
  abstract updateEntity(entityId: string, updateData: UpdateEntityData): Promise<boolean>;
  abstract deleteEntity(entityId: string): Promise<boolean>;
  abstract entityExists(entityId: string): Promise<boolean>;
  abstract getStatistics(accountId: string, entityId?: string): Promise<{ entity_id: string; data: Record<string, any>; created_at?: Date; updated_at?: Date } | Array<{ entity_id: string; data: Record<string, any>; created_at?: Date; updated_at?: Date }> | null>;
} 