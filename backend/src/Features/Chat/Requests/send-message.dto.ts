import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ description: 'User message content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Optional conversation ID to continue existing conversation', required: false })
  @IsString()
  @IsOptional()
  conversationId?: string;

  @ApiProperty({ description: 'Optional message metadata', required: false })
  @IsOptional()
  metadata?: any;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Unique message ID' })
  messageId: string;

  @ApiProperty({ description: 'Stream URL for real-time response' })
  streamUrl: string;
}

export class StreamResponseDto {
  @ApiProperty({ description: 'Message content chunk' })
  content: string;

  @ApiProperty({ description: 'Whether streaming is complete' })
  isComplete: boolean;

  @ApiProperty({ description: 'Message ID' })
  messageId: string;
}
