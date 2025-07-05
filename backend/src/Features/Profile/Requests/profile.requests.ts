import { ApiProperty, OmitType } from "@nestjs/swagger";
import { IsString, IsEmail, IsEnum, IsOptional, IsObject, IsDateString, IsNumber, IsMongoId } from "class-validator";
import { UserType } from "src/Common/consts/userType";
import { Type } from "class-transformer";

// Account Requests
export class CreateAccountRequest {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['individual', 'business'], required: false, example: 'individual' })
  @IsOptional()
  @IsEnum(['individual', 'business'])
  account_type?: 'individual' | 'business';

  @ApiProperty({ required: false, example: 'Test Company LLC' })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ required: false, example: '123456789' })
  @IsOptional()
  @IsString()
  tax_id?: string;

  @ApiProperty({ required: false, example: 'VAT123456' })
  @IsOptional()
  @IsString()
  vat_number?: string;

  @ApiProperty({ required: false, example: 'REG123456' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({ 
    required: false,
    example: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      postal_code: '10001',
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

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'https://example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    example: {
      default_currency: 'USD',
      vat_rate: 20,
      reclaim_threshold: 100,
      auto_process: false
    }
  })
  @IsObject()
  vat_settings: {
    default_currency: string;
    vat_rate: number;
    reclaim_threshold: number;
    auto_process: boolean;
  };
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
  tax_id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vat_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registration_number?: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  vat_settings?: {
    default_currency?: string;
    vat_rate?: number;
    reclaim_threshold?: number;
    auto_process?: boolean;
  };
}

// Entity Requests
export class CreateEntityRequest {
  @ApiProperty({ example: '686172f49a2e1d6393245694', required: false })
  @IsOptional()
  @IsString()
  @IsMongoId()
  accountId?: string;

  @ApiProperty({ example: 'Test Entity LLC' })
  @IsString()
  name: string;

  @ApiProperty({ 
    enum: ['company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], 
    required: false,
    example: 'company'
  })
  @IsOptional()
  @IsEnum(['company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'])
  entity_type?: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';

  @ApiProperty({ required: false, example: 'COMP123456' })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({ required: false, example: '2020-01-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  incorporation_date?: Date;

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

  @ApiProperty({ required: false, example: 'entity@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    required: false,
    example: {
      vat_number: 'VAT789012',
      tax_id: 'TAX789012',
      vat_rate: 21,
      currency: 'USD',
      filing_frequency: 'quarterly'
    }
  })
  @IsOptional()
  @IsObject()
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };

  @ApiProperty({ required: false, example: 'Sample business entity for testing' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateEntityBodyDto extends OmitType(CreateEntityRequest, ['accountId'] as const) {}

export class UpdateEntityRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ enum: ['company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], required: false })
  @IsOptional()
  @IsEnum(['company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'])
  entity_type?: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  registration_number?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  incorporation_date?: Date;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };

  @ApiProperty({ enum: ['active', 'inactive', 'dissolved'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'dissolved'])
  status?: 'active' | 'inactive' | 'dissolved';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
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
    enum: UserType, 
    example: 1, // 0: operator, 1: admin, 2: member, 3: guest
    default: 1,
    description: 'Role/type of the user (0: operator, 1: admin, 2: member, 3: guest)'
  })
  @IsEnum(UserType)
  @IsNumber()
  userType: UserType;

  @ApiProperty({
    example: '686174a98307686bff647c0c',
    default: '686174a98307686bff647c0c',
    description: 'ID of the account this user belongs to'
  })
  @IsString()
  @IsMongoId()
  accountId: string;

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
    enum: UserType, 
    required: false, 
    example: 2, // 0: operator, 1: admin, 2: member, 3: guest
    description: 'Role/type of the user (0: operator, 1: admin, 2: member, 3: guest)'
  })
  @IsOptional()
  @IsEnum(UserType)
  @IsNumber()
  userType?: UserType;

  @ApiProperty({ enum: ['active', 'inactive', 'pending'], required: false, example: 'active' })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'])
  status?: 'active' | 'inactive' | 'pending';

  @ApiProperty({ required: false, example: '+1987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'https://example.com/new-avatar.jpg' })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
} 