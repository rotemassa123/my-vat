export interface EntityData {
  _id?: string;
  accountId: string;
  name: string;
  entity_type: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';
  legal_name?: string;
  registration_number?: string;
  incorporation_date?: Date;
  incorporation_country?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };
  status: 'active' | 'inactive' | 'dissolved';
  description?: string;
  business_activities: string[];
  parent_entity_id?: string;
  is_vat_registered: boolean;
  vat_registration_date?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateEntityData {
  accountId: string;
  name: string;
  entity_type: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';
  legal_name?: string;
  registration_number?: string;
  incorporation_date?: Date;
  incorporation_country?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };
  status?: 'active' | 'inactive' | 'dissolved';
  description?: string;
  business_activities?: string[];
  parent_entity_id?: string;
  is_vat_registered?: boolean;
  vat_registration_date?: Date;
}

export interface UpdateEntityData {
  name?: string;
  entity_type?: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';
  legal_name?: string;
  registration_number?: string;
  incorporation_date?: Date;
  incorporation_country?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  website?: string;
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };
  status?: 'active' | 'inactive' | 'dissolved';
  description?: string;
  business_activities?: string[];
  parent_entity_id?: string;
  is_vat_registered?: boolean;
  vat_registration_date?: Date;
}

export abstract class IEntityRepository {
  abstract findEntityById(entityId: string): Promise<EntityData | null>;
  abstract findEntitiesByAccountId(accountId: string): Promise<EntityData[]>;
  abstract createEntity(entityData: CreateEntityData): Promise<EntityData>;
  abstract updateEntity(entityId: string, updateData: UpdateEntityData): Promise<boolean>;
  abstract deleteEntity(entityId: string): Promise<boolean>;
  abstract entityExists(entityId: string): Promise<boolean>;
} 