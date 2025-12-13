import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject } from '@nestjs/common';
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
    const userContext = this.getUserContext();
    const userId = userContext.userId;
    
    if (!userId) {
      throw new ForbiddenException('User ID not found in context');
    }

    // Create the first message with the ticket content and attachments
    const firstMessage = {
      content: createDto.content,
      senderId: new mongoose.Types.ObjectId(userId),
      senderType: SenderType.USER,
      attachments: createDto.attachments || [],
      createdAt: new Date(),
    };

    const ticket = new this.ticketModel({
      title: createDto.title,
      user_id: new mongoose.Types.ObjectId(userId),
      status: TicketStatus.OPEN,
      messages: [firstMessage],
      lastMessageAt: new Date(),
    });

    const savedTicket = await ticket.save();
    return this.mapToTicketResponse(savedTicket);
  }

  async getUserTickets(): Promise<TicketListResponse> {
    const userContext = this.getUserContext();
    const userType = userContext.userType;
    const isOperator = userType === UserType.operator;

    // For operators, get all tickets. For regular users, UserScopePlugin filters by user_id
    const query = this.ticketModel.find();
    
    if (isOperator) {
      query.setOptions({ disableUserScope: true });
    }
    
    const tickets = await query
      .sort({ lastMessageAt: -1 })
      .populate('handlerId', 'fullName email')
      .populate({
        path: 'user_id',
        select: 'fullName email',
      })
      .exec();

    // Handle cases where populate set user_id to null (user doesn't exist)
    for (const ticket of tickets) {
      if (!ticket.user_id) {
        const rawTicket = await this.ticketModel.findById(ticket._id).lean().exec();
        if (rawTicket?.user_id) {
          (ticket as any).user_id = rawTicket.user_id;
        }
      }
    }

    return {
      tickets: tickets.map(t => this.mapToTicketResponse(t)),
      total: tickets.length,
    };
  }

  async getTicketById(ticketId: string, userType: UserType): Promise<TicketResponse> {
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

    // If populate set user_id to null (user doesn't exist), restore the ObjectId from raw document
    if (!ticket.user_id) {
      const rawTicket = await this.ticketModel.findById(ticketId).lean().exec();
      if (rawTicket?.user_id) {
        (ticket as any).user_id = rawTicket.user_id;
      } else {
        throw new Error('Ticket user_id is missing in database');
      }
    }

    return this.mapToTicketResponse(ticket);
  }

  async sendMessage(
    ticketId: string,
    messageDto: SendTicketMessageDto,
    userType: UserType,
    userId?: string,
  ): Promise<TicketMessageResponse> {
    // Get userId from parameter (WebSocket) or context (HTTP)
    let finalUserId = userId;
    
    if (!finalUserId) {
      throw new ForbiddenException('User ID not found');
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

    const senderType = userType === UserType.operator ? SenderType.OPERATOR : SenderType.USER;

    // Validate that either content or attachments are provided
    if (!messageDto.content?.trim() && (!messageDto.attachments || messageDto.attachments.length === 0)) {
      throw new BadRequestException('Message must have either content or attachments');
    }

    const newMessage = {
      content: messageDto.content || '',
      senderId: new mongoose.Types.ObjectId(finalUserId),
      senderType: senderType,
      attachments: messageDto.attachments || [],
      createdAt: new Date(),
    };

    // Use updateOne with $push to ensure the message is saved
    // This avoids issues with Mongoose not detecting array changes on save()
    const updateData: any = {
      $push: { messages: newMessage },
      $set: {
        lastMessageAt: new Date(),
      },
    };

    // Auto-update status based on sender
    if (userType === UserType.operator && ticket.status === TicketStatus.OPEN) {
      updateData.$set.status = TicketStatus.IN_PROGRESS;
    } else if (userType !== UserType.operator && ticket.status === TicketStatus.IN_PROGRESS) {
      updateData.$set.status = TicketStatus.WAITING;
    }

    // Use updateOne to ensure the message is saved (avoids Mongoose array detection issues)
    await this.ticketModel.updateOne(
      { _id: ticket._id },
      updateData,
    );

    return {
      content: newMessage.content,
      senderId: newMessage.senderId.toString(),
      senderType: newMessage.senderType,
      attachments: newMessage.attachments,
      createdAt: newMessage.createdAt,
    };
  }

  async getUnhandledTickets(): Promise<TicketListResponse> {
    const tickets = await this.ticketModel
      .find({ status: TicketStatus.OPEN })
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

    const ticket = await this.ticketModel
      .findOne({ _id: new mongoose.Types.ObjectId(ticketId) })
      .setOptions({ disableUserScope: true })
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const handlerId = assignDto.operatorId 
      ? new mongoose.Types.ObjectId(assignDto.operatorId) 
      : new mongoose.Types.ObjectId(operatorId);
    
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
    const ticket = await this.ticketModel
      .findOne({ _id: new mongoose.Types.ObjectId(ticketId) })
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
    const handlerName = handler && 'fullName' in handler && typeof handler.fullName === 'string' 
      ? handler.fullName 
      : undefined;

    // Extract userId - handle both populated user object and ObjectId
    let userId: string;
    if (!ticket.user_id) {
      throw new Error('Ticket user_id is missing - this indicates a data integrity issue');
    }
    
    if (typeof ticket.user_id === 'object') {
      if ('_id' in ticket.user_id && ticket.user_id._id) {
        userId = ticket.user_id._id.toString();
      } else if ('id' in ticket.user_id && ticket.user_id.id) {
        userId = ticket.user_id.id.toString();
      } else if ('toString' in ticket.user_id) {
        userId = ticket.user_id.toString();
      } else {
        throw new Error('Unable to extract userId from ticket.user_id');
      }
    } else {
      userId = String(ticket.user_id);
    }

    // Handle legacy data: if messages array is empty but content/attachments exist, create a message from them
    let messages = ticket.messages || [];
    const ticketAny = ticket as any;
    if (messages.length === 0 && (ticketAny.content || (ticketAny.attachments && ticketAny.attachments.length > 0))) {
      // Legacy ticket - create first message from content/attachments
      messages = [{
        content: ticketAny.content || '',
        senderId: ticket.user_id,
        senderType: SenderType.USER,
        attachments: (ticketAny.attachments || []).map((att: any) => ({
          url: typeof att === 'string' ? att : att.url,
          fileName: typeof att === 'string' ? (att as string).split('/').pop() || 'file' : att.fileName,
        })),
        createdAt: ticket.created_at || new Date(),
      }];
    }

    return {
      id: ticket._id.toString(),
      title: ticket.title,
      userId,
      handlerId: ticket.handlerId?.toString(),
      handlerName,
      status: ticket.status,
      messages: messages.map(msg => ({
        content: msg.content,
        senderId: msg.senderId.toString(),
        senderType: msg.senderType,
        attachments: (msg.attachments || []).map((att: any) => ({
          url: typeof att === 'string' ? att : att.url,
          fileName: typeof att === 'string' ? (att as string).split('/').pop() || 'file' : att.fileName,
        })),
        createdAt: msg.createdAt,
      })),
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    };
  }
}

