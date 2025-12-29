import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsString, IsEmail, IsEnum, IsOptional, IsObject, IsDateString, IsNumber, IsMongoId } from "class-validator";
import { UserRole } from "src/Common/consts/userRole";

// Account Requests
export class CreateAccountRequest {
  @ApiProperty({ enum: ['individual', 'business'], required: false, example: 'individual' })
  @IsOptional()
  @IsEnum(['individual', 'business'])
  account_type?: 'individual' | 'business';

  @ApiProperty({ required: false, example: 'Test Company LLC' })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ required: false, example: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;
}

export class UpdateAccountRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEnum(['individual', 'business'])
  account_type?: 'individual' | 'business';

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: 'active' | 'inactive' | 'suspended';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;
}

// Entity Requests
export class CreateEntityRequest {
  @ApiProperty({ example: '686172f49a2e1d6393245694', required: true })
  @IsString()
  @IsMongoId()
  accountId: string;

  @ApiProperty({ enum: ['individual', 'business', 'company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], required: false, example: 'individual' })
  @IsOptional()
  @IsEnum(['individual', 'business', 'company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'])
  entity_type?: 'individual' | 'business' | 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';

  @ApiProperty({ required: false, example: 'Test Entity LLC' })
  @IsOptional()
  @IsString()
  entity_name?: string;

  @ApiProperty({ required: false, example: 'Sample business entity for testing' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false, example: 'entity@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    required: false,
    example: {
      street: '456 Business Ave',
      city: 'New York',
      state: 'NY',
      postal_code: '10002',
      country: 'USA'
    }
  })
  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @ApiProperty({ required: false, example: '+1987654321' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateEntityBodyDto extends OmitType(CreateEntityRequest, ['accountId'] as const) {}

export class UpdateEntityRequest {
  @ApiProperty({ enum: ['individual', 'business', 'company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], required: false })
  @IsOptional()
  @IsEnum(['individual', 'business', 'company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'])
  entity_type?: 'individual' | 'business' | 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';

  @ApiProperty({ enum: ['active', 'inactive'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  entity_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

// User Requests
export class CreateUserRequest {
  @ApiProperty({ 
    example: 'John Doe',
    default: 'John Doe',
    description: 'Full name of the user'
  })
  @IsString()
  fullName: string;

  @ApiProperty({ 
    example: 'john@example.com',
    default: 'john@example.com',
    description: 'Email address for the user'
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    default: 'password123',
    description: 'Password for the user account'
  })
  @IsString()
  password: string;

  @ApiProperty({ 
    enum: UserRole, 
    example: UserRole.ADMIN,
    default: UserRole.ADMIN,
    description: 'Role of the user (operator, admin, member, viewer)'
  })
  @IsEnum(UserRole)
  @IsString()
  userType: UserRole;

  @ApiProperty({
    example: '686174a98307686bff647c0c',
    default: '686174a98307686bff647c0c',
    description: 'ID of the account this user belongs to',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  accountId?: string;

  @ApiProperty({
    example: '686174a98307686bff647c0d',
    default: '686174a98307686bff647c0d',
    description: 'ID of the entity this user belongs to',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsMongoId()
  entityId?: string;

  @ApiProperty({ 
    required: false, 
    example: '+1234567890',
    default: '+1234567890',
    description: 'Phone number of the user'
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ 
    required: false, 
    example: 'https://example.com/avatar.jpg',
    default: 'https://example.com/avatar.jpg',
    description: 'URL to user profile image'
  })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
}

export class UpdateUserRequest {
  @ApiProperty({ required: false, example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false, example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'newpassword123' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ 
    enum: UserRole, 
    required: false, 
    example: UserRole.MEMBER,
    description: 'Role of the user (operator, admin, member, viewer)'
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsString()
  userType?: UserRole;

  @ApiProperty({ enum: ['active', 'inactive', 'pending', 'failed to send request'], required: false, example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending', 'failed to send request'])
  status?: 'active' | 'inactive' | 'pending' | 'failed to send request';

  @ApiProperty({ required: false, example: '+1987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'https://example.com/new-avatar.jpg' })
  @IsOptional()
  @IsString()
  profile_image_url?: string;

  @ApiProperty({ required: false, example: '686174a98307686bff647c0c' })
  @IsOptional()
  @IsMongoId()
  accountId?: string;

  @ApiProperty({ required: false, example: '686174a98307686bff647c0d' })
  @IsOptional()
  @IsMongoId()
  entityId?: string;
} 