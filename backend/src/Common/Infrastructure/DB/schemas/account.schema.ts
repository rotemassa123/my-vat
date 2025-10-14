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

  @Prop({ enum: ['individual', 'business'], default: 'individual' })
  account_type: string;

  @Prop({ enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: string;

  @Prop()
  company_name?: string;

  @Prop()
  description?: string;

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

  @Prop()
  last_login?: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account); 