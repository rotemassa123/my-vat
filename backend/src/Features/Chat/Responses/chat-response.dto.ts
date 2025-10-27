import { ApiProperty } from '@nestjs/swagger';

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
