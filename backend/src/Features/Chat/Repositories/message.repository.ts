import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../../../Common/Infrastructure/DB/schemas/message.schema';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export interface CreateMessageData {
  conversation_id: string;
  role?: 'system' | 'user' | 'assistant' | 'tool';
  sender_type?: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  message_id?: string;
  is_error?: boolean;
  metadata?: Record<string, any>;
}

export interface IMessageRepository {
  findMessagesByConversation(conversationId: string): Promise<MessageDocument[]>;
  createMessage(message: CreateMessageData): Promise<MessageDocument>;
  createMessages(messages: CreateMessageData[]): Promise<MessageDocument[]>;
}

@Injectable()
export class MessageRepository implements IMessageRepository {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findMessagesByConversation(conversationId: string): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        conversation_id: new mongoose.Types.ObjectId(conversationId),
      })
      .sort({ created_at: 1 })
      .exec();
  }

  async createMessage(message: CreateMessageData): Promise<MessageDocument> {
    const messageData = {
      ...message,
      conversation_id: new mongoose.Types.ObjectId(message.conversation_id),
      message_id: message.message_id || uuidv4(),
      role: message.role || message.sender_type || 'user',
      sender_type: message.sender_type || message.role || 'user',
    };

    const createdMessage = new this.messageModel(messageData);
    return createdMessage.save();
  }

  async createMessages(messages: CreateMessageData[]): Promise<MessageDocument[]> {
    const createdMessages = messages.map((message) => {
      const messageData = {
        ...message,
        conversation_id: new mongoose.Types.ObjectId(message.conversation_id),
        message_id: message.message_id || uuidv4(),
        role: message.role || message.sender_type || 'user',
        sender_type: message.sender_type || message.role || 'user',
      };
      return new this.messageModel(messageData);
    });

    return this.messageModel.insertMany(createdMessages);
  }
}

