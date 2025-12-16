import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TicketsService } from '../Services/tickets.service';
import {
  CreateTicketDto,
  SendTicketMessageDto,
  UpdateTicketStatusDto,
  AssignTicketDto,
} from '../Requests/ticket.requests';
import {
  TicketResponse,
  TicketListResponse,
  TicketMessageResponse,
} from '../Responses/ticket.responses';
import { RequireRoles } from '../../../Common/Infrastructure/decorators/require-roles.decorator';
import { UserType } from '../../../Common/consts/userType';
import { RolesGuard } from '../../../Common/Infrastructure/guards/roles.guard';
import { AuthenticationGuard } from '../../../Common/Infrastructure/guards/authentication.guard';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../../Common/Infrastructure/types/user-context.type';
import { TicketsGateway } from '../Gateways/tickets.gateway';

@ApiTags('tickets')
@Controller('tickets')
@UseGuards(AuthenticationGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    @Inject(forwardRef(() => TicketsGateway))
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  private getUserType(): UserType {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    return userContext?.userType || UserType.member;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully', type: TicketResponse })
  async createTicket(
    @Body() createDto: CreateTicketDto,
  ): Promise<TicketResponse> {
    return this.ticketsService.createTicket(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user tickets (sorted by last update)' })
  @ApiResponse({ status: 200, description: 'List of user tickets', type: TicketListResponse })
  async getUserTickets(): Promise<TicketListResponse> {
    return this.ticketsService.getUserTickets();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details', type: TicketResponse })
  async getTicketById(
    @Param('id') ticketId: string,
  ): Promise<TicketResponse> {
    return this.ticketsService.getTicketById(ticketId, this.getUserType());
  }

  @Post(':id/messages')
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Send a message in a ticket' })
  @ApiResponse({ status: 201, description: 'Message sent successfully', type: TicketMessageResponse })
  async sendMessage(
    @Param('id') ticketId: string,
    @Body() messageDto: SendTicketMessageDto,
  ): Promise<TicketMessageResponse> {
    return this.ticketsService.sendMessage(
      ticketId,
      messageDto,
      this.getUserType(),
    );
  }

  @Get('operator/unhandled')
  @RequireRoles(UserType.operator)
  @ApiOperation({ summary: 'Get unhandled tickets (operator only)' })
  @ApiResponse({ status: 200, description: 'List of unhandled tickets', type: TicketListResponse })
  async getUnhandledTickets(): Promise<TicketListResponse> {
    return this.ticketsService.getUnhandledTickets();
  }

  @Get('operator/all')
  @RequireRoles(UserType.operator)
  @ApiOperation({ summary: 'Get all tickets sorted by update time (operator only)' })
  @ApiResponse({ status: 200, description: 'List of all tickets', type: TicketListResponse })
  async getAllTickets(): Promise<TicketListResponse> {
    return this.ticketsService.getAllTickets();
  }

  @Get('operator/assigned-to-me')
  @RequireRoles(UserType.operator)
  @ApiOperation({ summary: 'Get tickets assigned to current operator (operator only)' })
  @ApiResponse({ status: 200, description: 'List of tickets assigned to me', type: TicketListResponse })
  async getTicketsAssignedToMe(): Promise<TicketListResponse> {
    return this.ticketsService.getTicketsAssignedToMe();
  }

  @Put(':id/assign')
  @RequireRoles(UserType.operator)
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Assign ticket to operator (operator only)' })
  @ApiResponse({ status: 200, description: 'Ticket assigned successfully', type: TicketResponse })
  async assignTicket(
    @Param('id') ticketId: string,
    @Body() assignDto: AssignTicketDto,
  ): Promise<TicketResponse> {
    const ticket = await this.ticketsService.assignTicket(ticketId, assignDto);
    
    // Emit WebSocket event to notify all connected clients about the assignment
    this.ticketsGateway.emitTicketUpdate(ticketId, ticket);
    
    return ticket;
  }

  @Put(':id/unassign')
  @RequireRoles(UserType.operator)
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Unassign ticket from operator (operator only)' })
  @ApiResponse({ status: 200, description: 'Ticket unassigned successfully', type: TicketResponse })
  async unassignTicket(
    @Param('id') ticketId: string,
  ): Promise<TicketResponse> {
    const ticket = await this.ticketsService.unassignTicket(ticketId);
    
    // Emit WebSocket event to notify all connected clients about the unassignment
    this.ticketsGateway.emitTicketUpdate(ticketId, ticket);
    
    return ticket;
  }

  @Put(':id/status')
  @RequireRoles(UserType.operator)
  @ApiParam({ name: 'id', type: String })
  @ApiOperation({ summary: 'Update ticket status (operator only)' })
  @ApiResponse({ status: 200, description: 'Ticket status updated successfully', type: TicketResponse })
  async updateTicketStatus(
    @Param('id') ticketId: string,
    @Body() statusDto: UpdateTicketStatusDto,
  ): Promise<TicketResponse> {
    return this.ticketsService.updateTicketStatus(ticketId, statusDto);
  }
}

