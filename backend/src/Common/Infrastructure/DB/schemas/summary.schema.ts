import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type SummaryDocument = HydratedDocument<Summary>;

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  collection: 'summaries' 
})
export class Summary {
  @Prop({ required: true, index: true })
  account_id: number;

  @Prop({ required: true, unique: true })
  file_id: string;

  @Prop({ required: true, index: true })
  is_invoice: boolean;

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