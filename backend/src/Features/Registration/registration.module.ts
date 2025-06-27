import { Module } from '@nestjs/common';
import { RegistrationInfraModule } from "./registrationInfra.module";
import { UserController } from "src/Features/Registration/Controllers/user.controller";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";

@Module({
    imports: [
        RegistrationInfraModule,
    ],
    controllers: [UserController],
    providers: [PasswordService]
})
export class RegistrationModule {}
