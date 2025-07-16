import { Module } from '@nestjs/common';
import { ProfileInfraModule } from "./profileInfra.module";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { UserController } from './Controllers/user.controller';
import { AccountController } from './Controllers/account.controller';
import { EntityController } from './Controllers/entity.controller';
import { ProfileController } from './Controllers/profile.controller';
import { EmailController } from './Controllers/email.controller';

@Module({
    imports: [
        ProfileInfraModule,
    ],
    controllers: [UserController, AccountController, EntityController, ProfileController, EmailController],
    providers: [PasswordService]
})
export class ProfileModule {}
