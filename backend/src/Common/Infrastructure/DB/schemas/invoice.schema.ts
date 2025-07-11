import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { EntityScopePlugin } from '../../../../Common/plugins/entity-scope-new.plugin';

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

  @Prop({ index: true })
  created_at: Date;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);

InvoiceSchema.plugin(AccountScopePlugin);
InvoiceSchema.plugin(EntityScopePlugin); 