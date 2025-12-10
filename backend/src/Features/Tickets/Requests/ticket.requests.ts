import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { TicketStatus, SenderType } from 'src/Common/Infrastructure/DB/schemas/ticket.schema';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Ticket content/description' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Initial attachments (file URLs)', type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

export class SendTicketMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Message attachments (file URLs)', type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateTicketStatusDto {
  @ApiProperty({ description: 'New ticket status', enum: TicketStatus })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}

export class AssignTicketDto {
  @ApiProperty({ description: 'Operator user ID to assign ticket to', required: false })
  @IsString()
  @IsOptional()
  operatorId?: string;
}

