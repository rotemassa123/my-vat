import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus, SenderType } from 'src/Common/Infrastructure/DB/schemas/ticket.schema';

export class AttachmentDto {
  @ApiProperty({ description: 'File URL' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Ticket content/description' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Initial attachments', type: [AttachmentDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}

export class SendTicketMessageDto {
  @ApiProperty({ description: 'Message content (optional if attachments are provided)', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Message attachments', type: [AttachmentDto], required: false })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
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

export class UpdateTicketAttachmentsDto {
  @ApiProperty({ description: 'Attachment file information', type: [AttachmentDto] })
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments: AttachmentDto[];
}

