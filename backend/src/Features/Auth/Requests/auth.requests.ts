import {AutoMap} from "@automapper/classes";
import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";

export class SignInRequest {
    @ApiProperty({ example: 'john@example.com' })
    @AutoMap()
    @IsString()
    public email: string;

    @ApiProperty({ example: 'password123' })
    @AutoMap()
    @IsString()
    public password: string;
}
