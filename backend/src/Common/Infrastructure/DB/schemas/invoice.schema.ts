import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvoiceDocument = HydratedDocument<Invoice>;

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'invoices' 
})
export class Invoice {
  @Prop({ required: true, index: true })
  account_id: number;

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

// Additional indexes that match the current DB structure
InvoiceSchema.index({ account_id: 1 });
InvoiceSchema.index({ source_id: 1 }, { unique: true });
InvoiceSchema.index({ source: 1 });
InvoiceSchema.index({ status: 1 });
InvoiceSchema.index({ created_at: 1 }); 