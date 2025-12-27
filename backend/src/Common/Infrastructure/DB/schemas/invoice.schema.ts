import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { EntityScopePlugin } from '../../../plugins/entity-scope.plugin';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'invoices' 
})
export class Invoice {
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: mongoose.Types.ObjectId;
  
  // This property is defined for TypeScript type safety; the actual schema field is created by EntityScopePlugin.
  entity_id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  source_id: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  last_executed_step: number;

  @Prop({ required: true, index: true })
  source: string;

  @Prop({ required: true })
  content_type: string;

  @Prop({ required: true, index: true })
  status: string;

  @Prop({ default: null })
  reason: string | null;

  @Prop({ default: null })
  claim_amount: number | null;

  @Prop({ default: null })
  claim_submitted_at: Date | null;

  @Prop({ default: null })
  claim_result_received_at: Date | null;

  @Prop({ required: true })
  status_updated_at: Date;

  // Invoice extracted data (populated from OpenAI processing)
  @Prop({ default: null, index: true })
  country?: string | null;

  @Prop({ default: null, index: true })
  supplier?: string | null;

  @Prop({ default: null, index: true })
  invoice_date?: string | null;

  @Prop({ default: null })
  invoice_id?: string | null;

  @Prop({ default: null })
  description?: string | null;

  @Prop({ default: null })
  total_amount?: number | null;

  @Prop({ default: null })
  classification?: string | null;

  @Prop({ default: null })
  subclassification?: string | null;

  @Prop({ default: null })
  net_amount?: number | null;

  @Prop({ default: null })
  vat_amount?: number | null;

  @Prop({ default: null })
  vat_rate?: number | null;

  @Prop({ default: null })
  currency?: string | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: null })
  detailed_items?: any[] | null;

  // Claimability assessment results
  @Prop({ default: null })
  is_claimable?: boolean | null;

  @Prop({ default: null })
  claimable_amount?: number | null;

  @Prop({ default: null })
  rejected_reason?: string | null;

  @Prop({ index: true })
  created_at: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.plugin(AccountScopePlugin);
InvoiceSchema.plugin(EntityScopePlugin); 