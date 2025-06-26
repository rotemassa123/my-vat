import {AutoMap} from "@automapper/classes";
import {ApiProperty} from "@nestjs/swagger";
import {IsNumber, IsString} from "class-validator";

export class SignInRequest {
    @ApiProperty()
    @AutoMap()
    @IsNumber()
    public userId: number;

    @ApiProperty()
    @AutoMap()
    @IsString()
    public password: string;
}
