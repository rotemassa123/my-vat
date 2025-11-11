import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { jwtModuleOptionsFactory } from "src/Common/Infrastructure/Config/Jwt.config";
import { MongooseConfigService } from "src/Common/Infrastructure/Config/mongoose.config";
import { Account, AccountSchema } from "src/Common/Infrastructure/DB/schemas/account.schema";
import { Entity, EntitySchema } from "src/Common/Infrastructure/DB/schemas/entity.schema";
import { IProfileRepository } from "src/Common/ApplicationCore/Services/IProfileRepository";
import { ProfileMongoService } from "src/Common/Infrastructure/Services/profile-mongo-service";
import { IGCSService } from "src/Common/ApplicationCore/Services/IGCSService";
import { GCSService } from "src/Common/Infrastructure/Services/GCSService";
import { IGmailService } from "src/Common/ApplicationCore/Services/IGmailService";
import { GmailService } from "src/Common/Infrastructure/Services/gmail.service";
import { IGoogleOAuthService } from "src/Common/ApplicationCore/Services/IGoogleOAuthService";
import { GoogleOAuthService } from "src/Common/Infrastructure/Services/google-oauth.service";
import { User, UserSchema } from "./DB/schemas/user.schema";
import { TenantContextInterceptor } from "../interceptors/context.interceptor";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DatabaseInitializationService } from "./Services/database-initialization.service";
import { Summary, SummarySchema } from "./DB/schemas/summary.schema";
import { Invoice, InvoiceSchema } from "./DB/schemas/invoice.schema";
import { Statistics, StatisticsSchema } from "./DB/schemas/statistics.schema";
import { IImageStorageProvider } from "../ApplicationCore/Providers/IImageStorageProvider";
import { CloudinaryStorageProvider } from "./Services/CloudinaryStorageProvider";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigService,
    }),
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: User.name, schema: UserSchema },
      { name: Entity.name, schema: EntitySchema },
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Summary.name, schema: SummarySchema },
      { name: Statistics.name, schema: StatisticsSchema },
    ]),
    JwtModule.registerAsync(jwtModuleOptionsFactory),
  ],
  providers: [
    ProfileMongoService,
    DatabaseInitializationService,
    { provide: IProfileRepository, useExisting: ProfileMongoService },
    { provide: IGCSService, useClass: GCSService },
    { provide: IGmailService, useClass: GmailService },
    { provide: IGoogleOAuthService, useClass: GoogleOAuthService },
    { provide: IImageStorageProvider, useClass: CloudinaryStorageProvider },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
  exports: [
    MongooseModule,
    JwtModule,
    IProfileRepository,
    IGCSService,
    IGmailService,
    IGoogleOAuthService,
    IImageStorageProvider,
  ],
})
export class InfraModule {}
