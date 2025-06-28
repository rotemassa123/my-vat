import { Module } from '@nestjs/common';
import { ProfileInfraModule } from "./profileInfra.module";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { UserController } from './Controllers/user.controller';
import { AccountController } from './Controllers/account.controller';
import { EntityController } from './Controllers/entity.controller';

@Module({
    imports: [
        ProfileInfraModule,
    ],
    controllers: [UserController, AccountController, EntityController],
    providers: [PasswordService]
})
export class ProfileModule {}
