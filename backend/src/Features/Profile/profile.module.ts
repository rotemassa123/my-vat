import { Module } from '@nestjs/common';
import { ProfileInfraModule } from "./profileInfra.module";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { TokenService } from "src/Common/Infrastructure/Services/token.service";
import { UserController } from './Controllers/user.controller';
import { AccountController } from './Controllers/account.controller';
import { EntityController } from './Controllers/entity.controller';
import { ProfileController } from './Controllers/profile.controller';
import { EmailController } from './Controllers/email.controller';
import { InvitationController } from './Controllers/invitation.controller';
import { InvitationService } from './Services/invitation.service';

@Module({
    imports: [
        ProfileInfraModule,
    ],
    controllers: [UserController, AccountController, EntityController, ProfileController, EmailController, InvitationController],
    providers: [PasswordService, InvitationService, TokenService]
})
export class ProfileModule {}
