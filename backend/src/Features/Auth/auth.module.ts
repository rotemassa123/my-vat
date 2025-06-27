import { Module } from '@nestjs/common';
import { AuthInfraModule } from "./authInfra.module";
import { AuthenticationController } from "src/Features/Auth/Controllers/authentication.controller";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";

@Module({
    imports: [
        AuthInfraModule,
    ],
    controllers: [AuthenticationController],
    providers: [PasswordService]
})
export class AuthModule {}
