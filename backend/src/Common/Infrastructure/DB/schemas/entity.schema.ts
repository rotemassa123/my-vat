import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type EntityDocument = HydratedDocument<Entity>;

export interface EntityAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface EntityVatSettings {
  vat_number?: string;
  tax_id?: string;
  vat_rate?: number;
  currency?: string;
  filing_frequency?: 'monthly' | 'quarterly' | 'annually';
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Entity {
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], required: false })
  entity_type?: string;

  @Prop()
  registration_number?: string;

  @Prop()
  incorporation_date?: Date;

  @Prop({ type: Object })
  address?: EntityAddress;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ type: Object })
  vat_settings?: EntityVatSettings;

  @Prop({ enum: ['active', 'inactive', 'dissolved'], default: 'active' })
  status: string;

  @Prop()
  description?: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);

EntitySchema.plugin(AccountScopePlugin); 