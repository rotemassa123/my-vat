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

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💬 CHAT REQUEST START');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📝 User Message: "${messageDto.message}"`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`🆔 Message ID: ${messageId}`);

    // Get user profile for personalized experience
    const userProfile = await this.userProfileService.getUserProfile(userId);
    console.log(`👨‍💼 User Profile: ${userProfile.firstName} ${userProfile.lastName} (${userProfile.email})`);
    console.log(`🏢 Company: ${userProfile.companyName || 'N/A'}`);

    // Check if this is the first message
    const isFirstMessage = this.threadCache.isFirstMessage(userId);
    console.log(`🔄 Is First Message: ${isFirstMessage}`);

    // Get user's persistent thread (with 1h TTL)
    const threadId = await this.threadCache.getUserThread(userId);
    console.log(`🧵 Thread ID: ${threadId}`);

    let contextData = null;

    // PHASE 1: Ask LLM what data it needs (skip for first message - use greeting)
    if (!isFirstMessage) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 PHASE 1: Asking LLM what data it needs');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const mcpJsonResponse = await this.openaiService.requestDataRequirements(
        messageDto.message,
        userProfile
      );
      console.log(`📥 Phase 1 Response (MCP JSON): ${mcpJsonResponse}`);

      // PHASE 2: Parse MCP response and fetch the requested data
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 PHASE 2: Parsing and fetching requested data');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      contextData = await this.mcpProcessor.parseAndFetchData(mcpJsonResponse, userContext);
      
      if (contextData) {
        // Log invoice count specifically
        if (contextData.invoices && Array.isArray(contextData.invoices)) {
          console.log(`📊 INVOICE COUNT: ${contextData.invoices.length} invoices fetched`);
          console.log(`📊 Invoice Status Breakdown:`, 
            contextData.invoices.reduce((acc: any, inv: any) => {
              const status = inv.status || 'unknown';
              acc[status] = (acc[status] || 0) + 1;
              return acc;
            }, {})
          );
        }
        console.log(`📦 Context Data Keys: ${Object.keys(contextData).join(', ')}`);
        console.log(`📦 Context Data Size: ${JSON.stringify(contextData).length} characters`);
      } else {
        console.log('📦 No context data fetched (general question)');
      }
    } else {
      console.log('⏭️  Skipping Phase 1 & 2 (first message - showing greeting)');
    }

    // PHASE 3: Send message with fetched data to LLM and stream the final response
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 PHASE 3: Sending message with data to LLM for final response');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const stream = await this.openaiService.processMessageWithData(
      messageDto.message,
      threadId,
      contextData,
      isFirstMessage,
      userProfile
    );

    // Stream the response chunks to the client
    let fullResponse = '';
    let chunkCount = 0;
    for await (const chunk of stream) {
      fullResponse += chunk;
      chunkCount++;
      onChunk(chunk);
    }

    console.log(`\n📥 PHASE 3 Response Received:`);
    console.log(`   Chunks: ${chunkCount}`);
    console.log(`   Response Length: ${fullResponse.length} characters`);
    console.log(`   Response Preview: ${fullResponse.substring(0, 200)}...`);

    // Mark first message as complete
    if (isFirstMessage) {
      this.threadCache.markFirstMessageComplete(userId);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ CHAT REQUEST COMPLETE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
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
