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
import { TicketMessageEvent, TicketResponse } from '../Responses/ticket.responses';
import { UserRole } from 'src/Common/consts/userRole';
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
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    client: Socket,
    payload: SendTicketMessageDto & { ticketId: string; userId: string },
  ) {
    const { ticketId, userId, ...messageDto } = payload;

    try {
      const user = await this.userModel.findById(userId).exec();
      const userType = user?.role || UserRole.MEMBER;

      // Set httpContext for service methods
      const userContext: UserContext = {
        userId: userId,
        userType: userType,
      };
      httpContext.set('user_context', userContext);

      const message = await this.ticketsService.sendMessage(
        ticketId,
        messageDto,
        userType,
        userId,
      );

      const ticket = await this.ticketsService.getTicketById(ticketId, userType);

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
      this.server.to(`ticket-${ticketId}`).emit('ticket-updated', {
        ticketId,
        ticket,
      });
    } catch (error) {
      client.emit('message-error', {
        ticketId,
        error: error.message || 'Failed to send message',
      });
    }
  }

  /**
   * Emit ticket update event to all clients connected to the ticket room
   * This can be called from controllers or services to notify clients of ticket changes
   */
  emitTicketUpdate(ticketId: string, ticket: TicketResponse): void {
    this.server.to(`ticket-${ticketId}`).emit('ticket-updated', {
      ticketId,
      ticket,
    });
  }

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}
}

