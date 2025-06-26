import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationInfraModule } from "./registrationInfra.module";
import { UserController } from "src/Features/Registration/Controllers/user.controller";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";

@Module({
    imports: [
        RegistrationInfraModule,
        TypeOrmModule.forFeature([UserEntity])
    ],
    controllers: [UserController],
    providers: [PasswordService]
})
export class RegistrationModule {}
