import { AutoMap } from '@automapper/classes';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class AddExampleRequest {
  @ApiProperty()
  @AutoMap()
  @IsString()
  public key: string;

  @ApiProperty()
  @AutoMap()
  @IsString()
  public value: string;

  @ApiProperty()
  @IsEmail()
  public email: string;
}

export class AddExampleResponse {
  public id: string;

  @AutoMap()
  public key: string;

  @AutoMap()
  public value: string;
}

export class GetExampleResponse {
  public id: string;

  public key: string;

  public value: string;
}
