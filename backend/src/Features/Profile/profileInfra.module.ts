import { Module } from "@nestjs/common";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";

@Module({
  imports: [],
  providers: [
    PasswordService,
  ],
  exports: [PasswordService],
})
export class ProfileInfraModule {}
