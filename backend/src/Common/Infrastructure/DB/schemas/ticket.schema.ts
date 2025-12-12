import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import { UserScopePlugin } from '../../../../Common/plugins/user-scope.plugin';

export type TicketDocument = HydratedDocument<Ticket>;

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING = 'waiting',
  CLOSED = 'closed',
}

export enum SenderType {
  USER = 'user',
  OPERATOR = 'operator',
}

export interface AttachmentInfo {
  url: string;
  fileName: string;
}

export interface TicketMessage {
  content: string;
  senderId: mongoose.Types.ObjectId;
  senderType: SenderType;
  attachments?: AttachmentInfo[];
  createdAt: Date;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Ticket {
  // user_id field will be added by UserScopePlugin (with alias userId)
  // Tickets are implicitly account-scoped via user relationship
  user_id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  })
  handlerId?: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(TicketStatus),
    default: TicketStatus.OPEN,
    index: true,
  })
  status: TicketStatus;

  @Prop({
    type: [
      {
        content: { type: String, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderType: { type: String, enum: Object.values(SenderType), required: true },
        attachments: {
          type: [
            {
              url: { type: String, required: true },
              fileName: { type: String, required: true },
            },
          ],
          default: [],
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  messages: TicketMessage[];

  @Prop({
    type: [
      {
        url: { type: String, required: true },
        fileName: { type: String, required: true },
      },
    ],
    default: [],
  })
  attachments: AttachmentInfo[];

  @Prop({ type: Date, default: Date.now, index: true })
  lastMessageAt: Date;

  // Explicit declaration for TypeScript type safety (fields are added by @Schema timestamps option)
  created_at: Date;
  updated_at: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Apply user scope plugin - automatically filters by user_id and sets it on save
// Tickets are implicitly account-scoped via user relationship (users have account_id)
TicketSchema.plugin(UserScopePlugin);

// Create indexes for efficient queries
TicketSchema.index({ user_id: 1, lastMessageAt: -1 });
TicketSchema.index({ handlerId: 1, status: 1 });
TicketSchema.index({ status: 1, lastMessageAt: -1 });

