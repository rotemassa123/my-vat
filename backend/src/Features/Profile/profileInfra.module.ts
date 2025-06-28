import { Module } from "@nestjs/common";
import { PasswordService } from "src/Common/ApplicationCore/Features/password.service";
import { InfraModule } from "src/Common/Infrastructure/infra.module";

@Module({
  imports: [InfraModule],
  providers: [
    PasswordService,
  ],
  exports: [PasswordService, InfraModule],
})
export class ProfileInfraModule {}
