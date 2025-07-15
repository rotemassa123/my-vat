import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, default as mongoose } from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { EntityScopePlugin } from '../../../plugins/entity-scope.plugin';

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
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: mongoose.Types.ObjectId;
  
  // This property is defined for TypeScript type safety; the actual schema field is created by EntityScopePlugin.
  entity_id: mongoose.Types.ObjectId;

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

SummarySchema.plugin(AccountScopePlugin);
SummarySchema.plugin(EntityScopePlugin); 