import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket, TicketDocument, TicketStatus, SenderType } from 'src/Common/Infrastructure/DB/schemas/ticket.schema';
import { CreateTicketDto, SendTicketMessageDto, UpdateTicketStatusDto, AssignTicketDto } from '../Requests/ticket.requests';
import { TicketResponse, TicketListResponse, TicketMessageResponse } from '../Responses/ticket.responses';
import { UserType } from 'src/Common/consts/userType';
import * as httpContext from 'express-http-context';
import { UserContext } from 'src/Common/Infrastructure/types/user-context.type';
import mongoose from 'mongoose';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,    
  ) {}

  private getUserContext(): UserContext {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    if (!userContext) {
      throw new ForbiddenException('User context not found');
    }
    return userContext;
  }

  async createTicket(createDto: CreateTicketDto): Promise<TicketResponse> {
    // UserScopePlugin will automatically set user_id on save
    const ticket = new this.ticketModel({
      ...createDto,
      status: TicketStatus.OPEN,
      messages: [],
      attachments: createDto.attachments || [],
      lastMessageAt: new Date(),
    });

    const savedTicket = await ticket.save();
    return this.mapToTicketResponse(savedTicket);
  }

  async getUserTickets(): Promise<TicketListResponse> {
    // UserScopePlugin automatically filters by user_id
    const tickets = await this.ticketModel
      .find()
      .sort({ lastMessageAt: -1 })
      .populate('handlerId', 'fullName email')
      .exec();

    return {
      tickets: tickets.map(t => this.mapToTicketResponse(t)),
      total: tickets.length,
    };
  }

  async getTicketById(ticketId: string, userType: UserType): Promise<TicketResponse> {
    // For operators, disable user scope to allow viewing any ticket
    const query = this.ticketModel.findOne({
      _id: new mongoose.Types.ObjectId(ticketId),
    });
    
    if (userType === UserType.operator) {
      query.setOptions({ disableUserScope: true });
    }
    
    const ticket = await query
      .populate('handlerId', 'fullName email')
      .populate('user_id', 'fullName email')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // UserScopePlugin automatically filters by user_id for regular users, so no additional permission check needed
    // Operators can see all tickets (user scope is disabled)

    return this.mapToTicketResponse(ticket);
  }

  async sendMessage(
    ticketId: string,
    messageDto: SendTicketMessageDto,
    userType: UserType,
  ): Promise<TicketMessageResponse> {
    const userContext = this.getUserContext();
    const userId = userContext.userId;
    
    if (!userId) {
      throw new ForbiddenException('User ID not found in context');
    }

    // For operators, disable user scope to allow messaging any ticket
    const query = this.ticketModel.findOne({
      _id: new mongoose.Types.ObjectId(ticketId),
    });
    
    if (userType === UserType.operator) {
      query.setOptions({ disableUserScope: true });
    }
    
    const ticket = await query.exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // UserScopePlugin automatically filters by user_id for regular users, so no additional permission check needed
    // Operators can send messages to any ticket (user scope is disabled)

    const senderType = userType === UserType.operator ? SenderType.OPERATOR : SenderType.USER;

    const newMessage = {
      content: messageDto.content,
      senderId: new mongoose.Types.ObjectId(userId),
      senderType: senderType,
      attachments: messageDto.attachments || [],
      createdAt: new Date(),
    };

    ticket.messages.push(newMessage);
    ticket.lastMessageAt = new Date();

    // Auto-update status: if operator sends message, set to in_progress; if user sends, set to waiting
    if (userType === UserType.operator && ticket.status === TicketStatus.OPEN) {
      ticket.status = TicketStatus.IN_PROGRESS;
    } else if (userType !== UserType.operator && ticket.status === TicketStatus.IN_PROGRESS) {
      ticket.status = TicketStatus.WAITING;
    }

    await ticket.save();

    return {
      content: newMessage.content,
      senderId: newMessage.senderId.toString(),
      senderType: newMessage.senderType,
      attachments: newMessage.attachments,
      createdAt: newMessage.createdAt,
    };
  }

  async getUnhandledTickets(): Promise<TicketListResponse> {
    // Disable user scope for operators to see all unhandled tickets
    const tickets = await this.ticketModel
      .find({
        status: TicketStatus.OPEN,
      })
      .setOptions({ disableUserScope: true })
      .sort({ lastMessageAt: -1 })
      .populate('user_id', 'fullName email')
      .exec();

    return {
      tickets: tickets.map(t => this.mapToTicketResponse(t)),
      total: tickets.length,
    };
  }

  async getAllTickets(): Promise<TicketListResponse> {
    // Disable user scope for operators to see all tickets
    const tickets = await this.ticketModel
      .find()
      .setOptions({ disableUserScope: true })
      .sort({ lastMessageAt: -1 })
      .populate('user_id', 'fullName email')
      .populate('handlerId', 'fullName email')
      .exec();

    return {
      tickets: tickets.map(t => this.mapToTicketResponse(t)),
      total: tickets.length,
    };
  }

  async assignTicket(ticketId: string, assignDto: AssignTicketDto): Promise<TicketResponse> {
    const userContext = this.getUserContext();
    const operatorId = userContext.userId;
    
    if (!operatorId) {
      throw new ForbiddenException('User ID not found in context');
    }

    // Disable user scope for operators
    const ticket = await this.ticketModel
      .findOne({
        _id: new mongoose.Types.ObjectId(ticketId),
      })
      .setOptions({ disableUserScope: true })
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const handlerId = assignDto.operatorId ? new mongoose.Types.ObjectId(assignDto.operatorId) : new mongoose.Types.ObjectId(operatorId);
    ticket.handlerId = handlerId;
    ticket.status = TicketStatus.IN_PROGRESS;

    await ticket.save();

    const populatedTicket = await this.ticketModel
      .findById(ticket._id)
      .setOptions({ disableUserScope: true })
      .populate('handlerId', 'fullName email')
      .populate('user_id', 'fullName email')
      .exec();

    return this.mapToTicketResponse(populatedTicket);
  }

  async updateTicketStatus(
    ticketId: string,
    statusDto: UpdateTicketStatusDto,
  ): Promise<TicketResponse> {
    // Disable user scope for operators
    const ticket = await this.ticketModel
      .findOne({
        _id: new mongoose.Types.ObjectId(ticketId),
      })
      .setOptions({ disableUserScope: true })
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    ticket.status = statusDto.status;
    await ticket.save();

    const populatedTicket = await this.ticketModel
      .findById(ticket._id)
      .setOptions({ disableUserScope: true })
      .populate('handlerId', 'fullName email')
      .populate('user_id', 'fullName email')
      .exec();

    return this.mapToTicketResponse(populatedTicket);
  }

  private mapToTicketResponse(ticket: TicketDocument): TicketResponse {
    const handler = ticket.handlerId && typeof ticket.handlerId === 'object' ? ticket.handlerId : null;
    // UserScopePlugin adds user_id field (with alias userId), so we use user_id
    const user = ticket.user_id && typeof ticket.user_id === 'object' ? ticket.user_id : null;

    // Type guard for handler with fullName
    const handlerName = handler && 'fullName' in handler && typeof handler.fullName === 'string' 
      ? handler.fullName 
      : undefined;

    return {
      id: ticket._id.toString(),
      title: ticket.title,
      content: ticket.content,
      userId: ticket.user_id.toString(),
      handlerId: ticket.handlerId?.toString(),
      handlerName,
      status: ticket.status,
      messages: ticket.messages.map(msg => ({
        content: msg.content,
        senderId: msg.senderId.toString(),
        senderType: msg.senderType,
        attachments: msg.attachments || [],
        createdAt: msg.createdAt,
      })),
      attachments: ticket.attachments || [],
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }
}

