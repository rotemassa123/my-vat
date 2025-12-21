import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  message_id: string;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Message role' })
  role: string;

  @ApiProperty({ description: 'Sender type' })
  sender_type?: string;

  @ApiProperty({ description: 'Created timestamp' })
  created_at?: Date;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'The AI assistant message' })
  message: ChatMessageResponseDto;

  @ApiProperty({ description: 'Conversation ID' })
  conversationId: string;
}
