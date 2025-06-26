import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { Module } from '@nestjs/common';
import { ApiModule } from './Common/API/api.module';
import { InfraModule } from './Common/Infrastructure/infra.module';
import { RegistrationModule } from "./Features/Registration/registration.module";
import { AuthModule } from "src/Features/Auth/auth.module";

@Module({
  imports: [
    ApiModule,
    InfraModule,
    AuthModule,
    RegistrationModule,
    AutomapperModule.forRoot({
      strategyInitializer: classes()
    })
  ],
})
export class AppModule {}
