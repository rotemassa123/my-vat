import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus, SenderType } from 'src/Common/Infrastructure/DB/schemas/ticket.schema';

export class TicketMessageResponse {
  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Sender user ID' })
  senderId: string;

  @ApiProperty({ description: 'Sender type', enum: SenderType })
  senderType: SenderType;

  @ApiProperty({ description: 'Message attachments', type: [String] })
  attachments: string[];

  @ApiProperty({ description: 'Message creation date' })
  createdAt: Date;
}

export class TicketResponse {
  @ApiProperty({ description: 'Ticket ID' })
  id: string;

  @ApiProperty({ description: 'Ticket title' })
  title: string;

  @ApiProperty({ description: 'Ticket content' })
  content: string;

  @ApiProperty({ description: 'User ID who created the ticket' })
  userId: string;

  @ApiProperty({ description: 'Operator ID handling the ticket', required: false })
  handlerId?: string;

  @ApiProperty({ description: 'Handler name', required: false })
  handlerName?: string;

  @ApiProperty({ description: 'Ticket status', enum: TicketStatus })
  status: TicketStatus;

  @ApiProperty({ description: 'Ticket messages', type: [TicketMessageResponse] })
  messages: TicketMessageResponse[];

  @ApiProperty({ description: 'Initial ticket attachments', type: [String] })
  attachments: string[];

  @ApiProperty({ description: 'Last message timestamp' })
  lastMessageAt: Date;

  @ApiProperty({ description: 'Ticket creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Ticket update date' })
  updatedAt: Date;
}

export class TicketListResponse {
  @ApiProperty({ description: 'List of tickets', type: [TicketResponse] })
  tickets: TicketResponse[];

  @ApiProperty({ description: 'Total count' })
  total: number;
}

export class TicketMessageEvent {
  @ApiProperty({ description: 'Ticket ID' })
  ticketId: string;

  @ApiProperty({ description: 'Message data', type: TicketMessageResponse })
  message: TicketMessageResponse;
}

