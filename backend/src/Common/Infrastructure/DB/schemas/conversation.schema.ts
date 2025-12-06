import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { AccountScopePlugin } from '../../../plugins/account-scope.plugin';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Conversation {
  // account_id field will be added by AccountScopePlugin
  account_id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user_id: mongoose.Types.ObjectId;

  @Prop({
    enum: ['active', 'archived', 'closed'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop()
  title?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;

  @Prop({ index: true })
  last_message_at?: Date;

  @Prop({ default: 0 })
  message_count: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Apply account scope plugin
ConversationSchema.plugin(AccountScopePlugin);
