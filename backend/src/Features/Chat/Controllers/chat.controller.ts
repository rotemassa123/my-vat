import { Controller, Post, Get, Param, Body, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from '../Services/chat.service';
import { SendMessageDto } from '../Requests/send-message.dto';
import { ChatResponseDto } from '../Responses/chat-response.dto';
import { CurrentUserId } from '../../../Common/decorators/current-user-id.decorator';
// import { JwtAuthGuard } from '../../../Common/Infrastructure/guards/jwt-auth.guard';

@ApiTags('Chat')
@Controller('chat')
// @UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService
  ) {}

  @Post('message')
  @ApiOperation({ summary: 'Send message to AI assistant with MCP data fetching' })
  @ApiResponse({ status: 200, description: 'Message processed successfully', type: ChatResponseDto })
  async sendMessage(
    @Body() messageDto: SendMessageDto,
    @CurrentUserId() userId: string
  ): Promise<ChatResponseDto> {
    return this.chatService.processMessage(messageDto, userId);
  }

  @Get('stream/:messageId')
  @ApiOperation({ summary: 'Stream AI response from persistent thread' })
  @ApiResponse({ status: 200, description: 'Streaming response' })
  async streamResponse(
    @Param('messageId') messageId: string,
    @Res() res: Response
  ): Promise<void> {
    return this.chatService.streamResponse(messageId, res);
  }
}
