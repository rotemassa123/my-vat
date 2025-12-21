import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from '../Services/chat.service';
import { SendMessageDto } from '../Requests/send-message.dto';
import { ChatResponseDto, ChatMessageResponseDto } from '../Responses/chat-response.dto';
import { CurrentUserId } from '../../../Common/decorators/current-user-id.decorator';

@ApiTags('Chat')
@Controller('chat')
// @UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService
  ) {}

  @Post('message')
  @ApiOperation({ summary: 'Send message to AI assistant and get response' })
  @ApiResponse({ status: 200, description: 'Message processed successfully', type: ChatResponseDto })
  async sendMessage(
    @Body() messageDto: SendMessageDto,
    @CurrentUserId() userId: string
  ): Promise<ChatResponseDto> {
    const result = await this.chatService.processMessage(messageDto, userId);
    
    // Map MessageDocument to ChatMessageResponseDto
    const messageResponse: ChatMessageResponseDto = {
      message_id: result.message.message_id,
      content: result.message.content,
      role: result.message.role || result.message.sender_type || 'assistant',
      sender_type: result.message.sender_type,
      created_at: (result.message as any).created_at,
    };

    return {
      message: messageResponse,
      conversationId: result.conversationId,
    };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  async createConversation(@CurrentUserId() userId: string): Promise<{ conversationId: string }> {
    const conversation = await this.chatService.createNewConversation(userId);
    return { conversationId: conversation._id.toString() };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations for the current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of conversations to return' })
  @ApiResponse({ status: 200, description: 'Conversations retrieved successfully' })
  async listConversations(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: number,
  ): Promise<{ conversations: Array<{ id: string; title?: string; lastMessageAt?: Date; messageCount: number; createdAt: Date }> }> {
    const conversations = await this.chatService.listConversations(userId, limit || 50);
    
    return {
      conversations: conversations.map(conv => ({
        id: conv._id.toString(),
        title: conv.title,
        lastMessageAt: conv.last_message_at,
        messageCount: conv.message_count,
        createdAt: (conv as any).created_at,
      })),
    };
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get all messages for a specific conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUserId() userId: string,
  ): Promise<{ messages: Array<{ message_id: string; content: string; role: string; sender_type?: string; created_at?: Date }> }> {
    const messages = await this.chatService.getConversationMessages(conversationId, userId);
    
    return {
      messages: messages.map(msg => ({
        message_id: msg.message_id,
        content: msg.content,
        role: msg.role || msg.sender_type || 'user',
        sender_type: msg.sender_type,
        created_at: (msg as any).created_at,
      })),
    };
  }
}
