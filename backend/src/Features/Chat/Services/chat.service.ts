import { Injectable } from '@nestjs/common';
import { MCPQueryProcessor } from './mcp-query-processor.service';
import { OpenAIService } from './openai-assistant.service';
import { ThreadCacheService } from './thread-cache.service';
import { UserProfileService, UserProfile } from './user-profile.service';
import { SendMessageDto } from '../Requests/send-message.dto';
import { ChatResponseDto } from '../Responses/chat-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChatService {
  constructor(
    private mcpProcessor: MCPQueryProcessor,
    private openaiService: OpenAIService,
    private threadCache: ThreadCacheService,
    private userProfileService: UserProfileService
  ) {}

  async processMessage(
    messageDto: SendMessageDto,
    userId: string
  ): Promise<ChatResponseDto> {
    const messageId = uuidv4();
    const userContext = { userId };

    // Get user profile for personalized experience
    const userProfile = await this.userProfileService.getUserProfile(userId);

    // Check if this is the first message
    const isFirstMessage = this.threadCache.isFirstMessage(userId);

    // Step 1: Use MCP to analyze query and fetch relevant data (skip for first message)
    let contextData = null;
    if (!isFirstMessage) {
      contextData = await this.mcpProcessor.processQuery(messageDto.message, userContext);
    }

    // Step 2: Get user's persistent thread (with 1h TTL)
    const threadId = await this.threadCache.getUserThread(userId);

    // Step 3: Send message with context to OpenAI Assistant
    await this.openaiService.processMessage(
      messageDto.message,
      threadId,
      contextData,
      isFirstMessage,
      userProfile
    );

    // Mark first message as complete
    if (isFirstMessage) {
      this.threadCache.markFirstMessageComplete(userId);
    }

    return {
      messageId,
      streamUrl: `/chat/stream/${messageId}`
    };
  }

  async processMessageStream(
    messageDto: SendMessageDto,
    userId: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const messageId = uuidv4();
    const userContext = { userId };

    // Get user profile for personalized experience
    const userProfile = await this.userProfileService.getUserProfile(userId);

    // Check if this is the first message
    const isFirstMessage = this.threadCache.isFirstMessage(userId);

    // Step 1: Use MCP to analyze query and fetch relevant data (skip for first message)
    let contextData = null;
    if (!isFirstMessage) {
      contextData = await this.mcpProcessor.processQuery(messageDto.message, userContext);
    }

    // Step 2: Get user's persistent thread (with 1h TTL)
    const threadId = await this.threadCache.getUserThread(userId);

    // Step 3: Process message and stream response
    const stream = await this.openaiService.processMessage(
      messageDto.message,
      threadId,
      contextData,
      isFirstMessage,
      userProfile
    );

    // Step 4: Stream the response chunks
    for await (const chunk of stream) {
      onChunk(chunk);
    }

    // Mark first message as complete
    if (isFirstMessage) {
      this.threadCache.markFirstMessageComplete(userId);
    }

    return messageId;
  }

  async streamResponse(messageId: string, res: any): Promise<void> {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    // TODO: Implement actual streaming from OpenAI Assistant thread
    // For now, return a mock response
    res.write('Mock streaming response for message: ' + messageId);
    res.end();
  }
}
