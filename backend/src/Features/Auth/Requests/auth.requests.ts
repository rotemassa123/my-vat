import {AutoMap} from "@automapper/classes";
import {ApiProperty} from "@nestjs/swagger";
import {IsNumber, IsString} from "class-validator";

export class SignInRequest {
    @ApiProperty()
    @AutoMap()
    @IsString()
    public email: string;

    @ApiProperty()
    @AutoMap()
    @IsString()
    public password: string;
}
