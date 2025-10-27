import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../Services/chat.service';
import { ThreadCacheService } from '../Services/thread-cache.service';
import { SendMessageDto } from '../Requests/send-message.dto';

@WebSocketGateway({
  cors: { 
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true 
  },
  namespace: '/chat',
  port: 8000
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private threadCache: ThreadCacheService
  ) {}

  @SubscribeMessage('join-chat')
  async handleJoinChat(client: Socket, payload: { userId: string }) {
    await client.join(`user-${payload.userId}`);
    
    // Ensure user has a persistent thread for this account (with 1h TTL)
    await this.threadCache.getUserThread(payload.userId);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(client: Socket, payload: SendMessageDto & { userId: string }) {
    // Use userId from payload instead of extracting from socket
    const userId = payload.userId || this.extractUserId(client);
    
    let messageId: string;
    
    try {
      // Process message and get streaming response
      messageId = await this.chatService.processMessageStream(
        payload, 
        userId,
        (chunk: string) => {
          // Send each chunk to the client
          this.server.to(`user-${userId}`).emit('ai-response-chunk', {
            messageId,
            chunk,
            isStreaming: true
          });
        }
      );
      
      // Send final response
      this.server.to(`user-${userId}`).emit('ai-response-complete', {
        messageId,
        isStreaming: false
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
      this.server.to(`user-${userId}`).emit('ai-response-error', {
        messageId: messageId || 'unknown',
        error: 'Message failed! Please try again.',
        isStreaming: false
      });
    }
  }

  private extractUserId(client: Socket): string {
    // TODO: Extract userId from JWT token or session
    // For now, return a mock userId
    return 'mock-user-id';
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
