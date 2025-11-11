import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import mongoose from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { EntityScopePlugin } from '../../../plugins/entity-scope.plugin';

export type StatisticsDocument = HydratedDocument<Statistics>;

export enum StatisticsType {
  OCR = 'ocr',
  GCS_UPLOAD = 'gcs_upload',
}

@Schema({ 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'statistics' 
})
export class Statistics {
  account_id: mongoose.Types.ObjectId;
  
  entity_id: mongoose.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed, default: {} })
  data: Record<string, any>;

  @Prop({ index: true })
  created_at: Date;

  @Prop({ index: true })
  updated_at: Date;
}

export const StatisticsSchema = SchemaFactory.createForClass(Statistics);

StatisticsSchema.plugin(AccountScopePlugin);
StatisticsSchema.plugin(EntityScopePlugin);

// Add compound index for efficient queries filtering by both account_id and entity_id
StatisticsSchema.index({ account_id: 1, entity_id: 1 });
StatisticsSchema.index({ created_at: 1 });

