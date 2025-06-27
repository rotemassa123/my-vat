import { Module } from '@nestjs/common';
import { ProfileInfraModule } from "./profileInfra.module";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { UserController } from './Controllers/user.controller';

@Module({
    imports: [
        ProfileInfraModule,
    ],
    controllers: [UserController],
    providers: [PasswordService]
})
export class ProfileModule {}
