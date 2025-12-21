import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SendMessageDto } from '../Requests/send-message.dto';
import { MessageRepository, CreateMessageData } from '../Repositories/message.repository';
import { AgentGateway } from '../Agents/agent.gateway';
import { formatMessagesForAgent, formatAgentOutputToEntities } from '../Utils/message-formatter';
import { Conversation, ConversationDocument } from '../../../Common/Infrastructure/DB/schemas/conversation.schema';
import { MessageDocument } from '../../../Common/Infrastructure/DB/schemas/message.schema';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../../Common/Infrastructure/types/user-context.type';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';

@Injectable()
export class ChatService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly agentGateway: AgentGateway,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) {}

  /**
   * Process a message and return the AI response
   */
  async processMessage(
    messageDto: SendMessageDto,
    userId: string,
  ): Promise<{ message: MessageDocument; conversationId: string }> {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    if (!userContext?.accountId) {
      throw new NotFoundException('Account not found in context');
    }

    // Get or create conversation - use provided ID or create new
    const conversation = messageDto.conversationId
      ? await this.getConversationById(messageDto.conversationId, userId, userContext.accountId)
      : await this.createNewConversation(userId, userContext.accountId);

    // Load conversation history (before adding new message)
    const allHistoryMessages = await this.messageRepository.findMessagesByConversation(
      conversation._id.toString(),
    );

    // Limit conversation history to reduce token costs
    // Keep last 20 messages (~10 exchanges) to maintain context while controlling costs
    const MAX_HISTORY_MESSAGES = 20;
    const historyMessages = allHistoryMessages.slice(-MAX_HISTORY_MESSAGES);

    // Create user message
    const userMessageData: CreateMessageData = {
      conversation_id: conversation._id.toString(),
      role: 'user',
      sender_type: 'user',
      content: messageDto.message,
    };

    const userMessage = await this.messageRepository.createMessage(userMessageData);

    // Format messages for agent (include the new user message)
    const allMessages = [...historyMessages, userMessage];
    const messagesForAgent = formatMessagesForAgent(allMessages);

    // Execute agent
    const agentOutput = await this.agentGateway.runAgent(messagesForAgent);

    // Format agent output to database entities
    const agentMessagesData = formatAgentOutputToEntities(
      agentOutput,
      conversation._id.toString(),
      userId,
    );

    // Save all agent messages
    const savedAgentMessages = await this.messageRepository.createMessages(agentMessagesData);

    // Update conversation last message timestamp and message count
    await this.conversationModel.updateOne(
      { _id: conversation._id },
      {
        $set: {
          last_message_at: new Date(),
          message_count: allMessages.length + savedAgentMessages.length,
        },
      },
    );

    // Generate title if this is the first AI response (conversation has no title yet)
    if (!conversation.title && savedAgentMessages.length > 0) {
      const lastAssistantMessage = savedAgentMessages
        .filter((msg) => msg.role === 'assistant' || msg.sender_type === 'assistant')
        .pop() || savedAgentMessages[savedAgentMessages.length - 1];
      
      if (lastAssistantMessage) {
        await this.generateConversationTitle(conversation._id.toString(), messageDto.message, lastAssistantMessage.content);
      }
    }

    // Return the last assistant message (usually the final response)
    const lastAssistantMessage = savedAgentMessages
      .filter((msg) => msg.role === 'assistant' || msg.sender_type === 'assistant')
      .pop() || savedAgentMessages[savedAgentMessages.length - 1];

    return {
      message: lastAssistantMessage,
      conversationId: conversation._id.toString(),
    };
  }

  /**
   * Create a new conversation for the user
   */
  async createNewConversation(
    userId: string,
    accountId?: string,
  ): Promise<ConversationDocument> {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    const finalAccountId = accountId || userContext?.accountId;
    
    if (!finalAccountId) {
      throw new NotFoundException('Account not found in context');
    }
    const newConversation = new this.conversationModel({
      user_id: new mongoose.Types.ObjectId(userId),
      account_id: new mongoose.Types.ObjectId(accountId),
      status: 'active',
      message_count: 0,
    });

    return newConversation.save();
  }

  /**
   * Get conversation by ID (with validation)
   */
  async getConversationById(
    conversationId: string,
    userId: string,
    accountId: string,
  ): Promise<ConversationDocument> {
    const conversation = await this.conversationModel
      .findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
        user_id: new mongoose.Types.ObjectId(userId),
        account_id: new mongoose.Types.ObjectId(accountId),
      })
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  /**
   * List conversations for a user
   */
  async listConversations(userId: string, limit: number = 50): Promise<ConversationDocument[]> {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    if (!userContext?.accountId) {
      throw new NotFoundException('Account not found in context');
    }

    return this.conversationModel
      .find({
        user_id: new mongoose.Types.ObjectId(userId),
        account_id: new mongoose.Types.ObjectId(userContext.accountId),
      })
      .sort({ last_message_at: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string, userId: string): Promise<MessageDocument[]> {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    if (!userContext?.accountId) {
      throw new NotFoundException('Account not found in context');
    }

    // Verify conversation belongs to user
    await this.getConversationById(conversationId, userId, userContext.accountId);

    return this.messageRepository.findMessagesByConversation(conversationId);
  }

  /**
   * Generate AI title for conversation based on first exchange
   */
  private async generateConversationTitle(
    conversationId: string,
    firstUserMessage: string,
    firstAiResponse: string,
  ): Promise<void> {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (max 60 characters) for this conversation based on the first user message and AI response. Return only the title, no quotes or explanations.',
          },
          {
            role: 'user',
            content: `User: ${firstUserMessage}\n\nAI: ${firstAiResponse.substring(0, 200)}`,
          },
        ],
        max_tokens: 30,
        temperature: 0.7,
      });

      const title = response.choices[0]?.message?.content?.trim() || 'New Conversation';
      
      await this.conversationModel.updateOne(
        { _id: new mongoose.Types.ObjectId(conversationId) },
        { $set: { title } },
      );
    } catch (error) {
      console.error('Failed to generate conversation title:', error);
      // Don't throw - title generation failure shouldn't break the flow
    }
  }
}
