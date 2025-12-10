import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TicketsService } from '../Services/tickets.service';
import { SendTicketMessageDto } from '../Requests/ticket.requests';
import { TicketMessageEvent } from '../Responses/ticket.responses';
import { UserType } from 'src/Common/consts/userType';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from 'src/Common/Infrastructure/DB/schemas/user.schema';
import * as httpContext from 'express-http-context';
import { UserContext } from 'src/Common/Infrastructure/types/user-context.type';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/tickets',
  port: 8000,
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private ticketsService: TicketsService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @SubscribeMessage('join-ticket')
  async handleJoinTicket(client: Socket, payload: { ticketId: string; userId: string }) {
    await client.join(`ticket-${payload.ticketId}`);
    console.log(`Client ${client.id} joined ticket room: ticket-${payload.ticketId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    client: Socket,
    payload: SendTicketMessageDto & { ticketId: string; userId: string },
  ) {
    const { ticketId, userId, ...messageDto } = payload;

    console.log(`\n🔌 Tickets Gateway: Received message for ticket ${ticketId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Message: "${messageDto.content}"`);

    try {
      // Look up user to determine user type
      const user = await this.userModel.findById(userId).exec();
      const userType = user?.userType || UserType.member;

      // Set httpContext for service methods (they use getUserContext())
      const userContext: UserContext = {
        userId: userId,
        userType: userType,
      };
      httpContext.set('user_context', userContext);

      // Send message via service
      const message = await this.ticketsService.sendMessage(
        ticketId,
        messageDto,
        userType,
      );

      // Get updated ticket to broadcast
      const ticket = await this.ticketsService.getTicketById(ticketId, userType);

      // Broadcast new message to all clients in the ticket room
      const event: TicketMessageEvent = {
        ticketId,
        message: {
          content: message.content,
          senderId: message.senderId,
          senderType: message.senderType,
          attachments: message.attachments,
          createdAt: message.createdAt,
        },
      };

      this.server.to(`ticket-${ticketId}`).emit('new-message', event);

      // Broadcast ticket update (status change, etc.)
      this.server.to(`ticket-${ticketId}`).emit('ticket-updated', {
        ticketId,
        ticket,
      });

      console.log(`✅ Tickets Gateway: Message sent successfully for ticket ${ticketId}`);
    } catch (error) {
      console.error('❌ Tickets Gateway: Error sending message:', error);
      client.emit('message-error', {
        ticketId,
        error: error.message || 'Failed to send message',
      });
    }
  }

  handleConnection(client: Socket) {
    console.log(`Tickets client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Tickets client disconnected: ${client.id}`);
  }
}

