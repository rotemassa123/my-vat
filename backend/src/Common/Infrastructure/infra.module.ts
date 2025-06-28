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
import { User, UserSchema } from "./DB/schemas/user.schema";

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
    ]),
    JwtModule.registerAsync(jwtModuleOptionsFactory),
  ],
  providers: [
    ProfileMongoService,
    { provide: IProfileRepository, useExisting: ProfileMongoService },
    { provide: IGCSService, useClass: GCSService },
  ],
  exports: [MongooseModule, JwtModule, IProfileRepository, IGCSService],
})
export class InfraModule {}
