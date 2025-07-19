import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum, IsArray, IsMongoId, ArrayMinSize, ArrayMaxSize, Length } from 'class-validator';
import { UserType } from 'src/Common/consts/userType';

export class SendInvitationRequest {
  @ApiProperty({
    example: ['user1@example.com', 'user2@example.com'],
    description: 'Array of email addresses to send invitations to',
    type: [String],
    minItems: 1,
    maxItems: 50
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one email address is required' })
  @ArrayMaxSize(50, { message: 'Maximum 50 email addresses allowed per request' })
  @IsEmail({}, { each: true, message: 'Each email must be a valid email address' })
  emails: string[];

  @ApiProperty({
    example: '686174a98307686bff647c0d',
    description: 'ID of the entity to invite users to (required for member/guest roles, optional for admin)',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  entityId?: string;

  @ApiProperty({
    example: 'member',
    description: 'Role to assign to the invited users (admin, member, viewer)',
    enum: ['admin', 'member', 'viewer'],
    required: false,
    default: 'member'
  })
  @IsOptional()
  @IsEnum(['admin', 'member', 'viewer'])
  role?: 'admin' | 'member' | 'viewer';

  @ApiProperty({
    example: 'Welcome to our VAT processing platform!',
    description: 'Optional personal message to include in the invitation email',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  personalMessage?: string;
}

export class InvitationResult {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address that was processed'
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Whether the invitation was sent successfully'
  })
  success: boolean;

  @ApiProperty({
    example: 'Invitation sent successfully',
    description: 'Message describing the result',
    required: false
  })
  message?: string;

  @ApiProperty({
    example: 'user_already_exists',
    description: 'Error code if invitation failed',
    required: false
  })
  errorCode?: string;

  @ApiProperty({
    example: '18c5b2e1a4b2c3d4e5f6',
    description: 'Gmail message ID if email was sent successfully',
    required: false
  })
  messageId?: string;
}

export interface SendInvitationResponse {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: InvitationResult[];
}

export class ValidateInvitationRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address from the invitation URL'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '686174a98307686bff647c0d',
    description: 'Account ID from the invitation URL'
  })
  @IsMongoId()
  accountId: string;

  @ApiProperty({
    example: '2',
    description: 'User role from the invitation URL'
  })
  @IsString()
  role: string;

  @ApiProperty({
    example: '686174a98307686bff647c0e',
    description: 'Entity ID from the invitation URL (optional for admin)',
    required: false
  })
  @IsOptional()
  @IsMongoId()
  entityId?: string;
}

export interface ValidateInvitationResponse {
  isValid: boolean;
  user?: {
    _id: string;
    fullName: string;
    email: string;
    userType: number;
    status: string;
  };
  account?: {
    _id: string;
    company_name: string;
    account_type: string;
  };
  entity?: {
    _id: string;
    name: string;
  };
  inviter?: {
    fullName: string;
  };
  error?: string;
}

export class CompleteSignupRequest {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address from the invitation'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user'
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    example: 'securePassword123!',
    description: 'Password for the user account'
  })
  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'Phone number (optional)',
    required: false
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile image URL (optional)',
    required: false
  })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
}

export interface CompleteSignupResponse {
  success: boolean;
  user: {
    _id: string;
    fullName: string;
    email: string;
    userType: number;
    accountId: string;
    entityId?: string;
    status: string;
  };
  message: string;
} 