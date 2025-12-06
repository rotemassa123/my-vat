import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Message {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversation_id: mongoose.Types.ObjectId;

  @Prop({
    enum: ['user', 'ai', 'support_agent'],
    required: true,
    index: true,
  })
  sender_type: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  support_agent_id?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, unique: true, index: true })
  message_id: string;

  @Prop({ default: false })
  is_error: boolean;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

