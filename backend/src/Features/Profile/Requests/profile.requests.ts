import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsEnum, IsOptional, IsObject, IsNumber, IsDateString, Validate } from "class-validator";
import { UserType } from "src/Common/consts/userType";
import { IsNineDigitUserId } from "src/Common/API/REST/DTOs/DTOs";

// Account Requests
export class CreateAccountRequest {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ['individual', 'business'], required: false })
  @IsOptional()
  @IsEnum(['individual', 'business'])
  account_type?: 'individual' | 'business';

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

  @ApiProperty()
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
  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsString()
  name: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

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
  @ApiProperty()
  @IsNumber()
  @Validate(IsNineDigitUserId, {
    message: "userId must be exactly 9 digits long",
  })
  userId: number;

  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty({ enum: UserType })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
}

export class UpdateUserRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: UserType, required: false })
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({ enum: ['active', 'inactive', 'pending'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'])
  status?: 'active' | 'inactive' | 'pending';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profile_image_url?: string;
} 