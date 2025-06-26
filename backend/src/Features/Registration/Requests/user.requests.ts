import { AutoMap } from "@automapper/classes";
import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsString, Validate } from "class-validator";
import { UserType } from "src/Common/consts/userType";
import { Optional } from "@nestjs/common";
import { IsNineDigitUserId } from "src/Common/API/REST/DTOs/DTOs";

export class CreateUserRequest {
  @ApiProperty()
  @AutoMap()
  @IsNumber()
  @Validate(IsNineDigitUserId, {
    message: "userId must be exactly 9 digits long",
  })
  public userId: number;

  @ApiProperty()
  @AutoMap()
  @IsString()
  public fullName: string;

  @ApiProperty()
  @AutoMap()
  @IsString()
  public password: string;

  @ApiProperty({ enum: UserType })
  @AutoMap()
  @IsEnum(UserType)
  public userType: UserType;
}

export class UpdateUserRequest {
  @ApiProperty()
  @AutoMap()
  @Optional()
  public fullName: string;

  @ApiProperty()
  @AutoMap()
  @Optional()
  public password: string;

  @ApiProperty()
  @AutoMap()
  @Optional()
  public userType: UserType;

  @ApiProperty({ required: false })
  @AutoMap()
  @IsString()
  @Optional()
  public profileImageUrl?: string;
}

export class LoginUserRequest {
  @ApiProperty()
  @AutoMap()
  @IsNumber()
  @Validate(IsNineDigitUserId, {
    message: "userId must be exactly 9 digits long",
  })
  public userId: number;

  @ApiProperty()
  @AutoMap()
  @IsString()
  public password: string;
}
