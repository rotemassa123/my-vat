import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { Module } from '@nestjs/common';
import { ApiModule } from './Common/API/api.module';
import { InfraModule } from './Common/Infrastructure/infra.module';
import { ProfileModule } from "./Features/Profile/profile.module";
import { AuthModule } from "src/Features/Auth/auth.module";
import { InvoiceModule } from "./Features/Invoice/invoice.module";

@Module({
  imports: [
    ApiModule,
    InfraModule,
    AuthModule,
    ProfileModule,
    InvoiceModule,
    AutomapperModule.forRoot({
      strategyInitializer: classes()
    })
  ],
})
export class AppModule {}
