import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SummaryDocument = HydratedDocument<Summary>;

export interface SummaryContent {
  country: string;
  supplier: string;
  date: string;
  id: string;
  description: string;
  net_amount: string;
  vat_amount: string;
  vat_rate: string;
  currency: string;
}

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'summaries' 
})
export class Summary {
  @Prop({ required: true, index: true })
  account_id: number;

  @Prop({ required: true, unique: true })
  file_id: string;

  @Prop({ required: true })
  file_name: string;

  @Prop({ required: true, index: true })
  is_invoice: boolean;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  summary_content: SummaryContent;

  @Prop()
  processing_time_seconds?: number;

  @Prop({ required: true })
  success: boolean;

  @Prop({ default: null })
  error_message: string | null;

  @Prop({ index: true })
  created_at: Date;

  // Additional fields that might be present in summary documents
  @Prop({ type: MongooseSchema.Types.Mixed })
  analysis_result?: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  extracted_data?: any;

  @Prop()
  confidence_score?: number;

  @Prop()
  processing_status?: string;

  @Prop()
  vat_amount?: number;

  @Prop()
  total_amount?: number;

  @Prop()
  currency?: string;

  @Prop()
  vendor_name?: string;

  @Prop()
  invoice_date?: Date;

  @Prop()
  invoice_number?: string;
}

export const SummarySchema = SchemaFactory.createForClass(Summary);

// Additional indexes that match the current DB structure
SummarySchema.index({ account_id: 1 });
SummarySchema.index({ file_id: 1 }, { unique: true });
SummarySchema.index({ is_invoice: 1 });
SummarySchema.index({ created_at: 1 }); 