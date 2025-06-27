import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

export interface VatSettings {
  default_currency: string;
  vat_rate: number;
  reclaim_threshold: number;
  auto_process: boolean;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Account {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['individual', 'business'], default: 'individual' })
  account_type: string;

  @Prop({ enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: string;

  @Prop()
  company_name?: string;

  @Prop()
  tax_id?: string;

  @Prop()
  vat_number?: string;

  @Prop()
  registration_number?: string;

  @Prop({ type: Object })
  address?: Address;

  @Prop()
  phone?: string;

  @Prop()
  website?: string;

  @Prop({ type: Object })
  vat_settings: VatSettings;

  @Prop({ required: true })
  password_hash: string;

  @Prop()
  google_user_id?: string;

  @Prop({ type: [String], default: ['email'] })
  auth_providers: string[];

  @Prop()
  last_login?: Date;

  @Prop({ default: 10000 })
  monthly_upload_limit_mb: number;

  @Prop({ default: 0 })
  current_month_usage_mb: number;

  @Prop({ type: [String], default: ['upload', 'process', 'view'] })
  permissions: string[];

  @Prop()
  verified_at?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account); 