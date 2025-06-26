import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthInfraModule } from "./authInfra.module";
import { AuthenticationController } from "src/Features/Auth/Controllers/authentication.controller";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";

@Module({
    imports: [
        AuthInfraModule,
        TypeOrmModule.forFeature([UserEntity])
    ],
    controllers: [AuthenticationController],
    providers: [PasswordService]
})
export class AuthModule {}
