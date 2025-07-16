import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { IGmailService, EmailOptions } from 'src/Common/ApplicationCore/Services/IGmailService';

export class SendEmailDto {
  @ApiProperty({ example: 'recipient@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ example: 'Test Email' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'This is a plain text body.', required: false })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ example: '<b>This is an HTML body.</b>', required: false })
  @IsString()
  @IsOptional()
  html?: string;

  @ApiProperty({ example: 'cc@example.com', required: false })
  @IsEmail()
  @IsOptional()
  cc?: string;

  @ApiProperty({ example: 'bcc@example.com', required: false })
  @IsEmail()
  @IsOptional()
  bcc?: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly gmailService: IGmailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<{ messageId: string }> {
    try {
      const emailOptions: EmailOptions = {
        to: sendEmailDto.to,
        subject: sendEmailDto.subject,
        text: sendEmailDto.text,
        html: sendEmailDto.html,
        ...(sendEmailDto.cc ? { cc: sendEmailDto.cc } : {}),
        ...(sendEmailDto.bcc ? { bcc: sendEmailDto.bcc } : {}),
      };

      const messageId = await this.gmailService.sendEmail(emailOptions);
      
      return { messageId };
    } catch (error) {
      throw new HttpException(
        `Failed to send email: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 