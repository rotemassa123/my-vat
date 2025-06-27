import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { JwtModule } from "@nestjs/jwt";
import { jwtModuleOptionsFactory } from "src/Common/Infrastructure/Config/Jwt.config";
import { MongooseConfigService } from "src/Common/Infrastructure/Config/mongoose.config";
import { Account, AccountSchema } from "src/Common/Infrastructure/DB/schemas/account.schema";
import { User, UserSchema } from "src/Common/Infrastructure/DB/schemas/user.schema";
import { Entity, EntitySchema } from "src/Common/Infrastructure/DB/schemas/entity.schema";
import { IUserRepository } from "src/Common/ApplicationCore/Services/IUserRepository";
import { UserMongoRepository } from "src/Common/Infrastructure/Services/UserMongoService";
import { IAccountRepository } from "src/Common/ApplicationCore/Services/IAccountRepository";
import { AccountMongoRepository } from "src/Common/Infrastructure/Services/AccountMongoService";
import { IEntityRepository } from "src/Common/ApplicationCore/Services/IEntityRepository";
import { EntityMongoRepository } from "src/Common/Infrastructure/Services/EntityMongoService";
import { IGCSService } from "src/Common/ApplicationCore/Services/IGCSService";
import { GCSService } from "src/Common/Infrastructure/Services/GCSService";

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
    { provide: IUserRepository, useClass: UserMongoRepository },
    { provide: IAccountRepository, useClass: AccountMongoRepository },
    { provide: IEntityRepository, useClass: EntityMongoRepository },
    { provide: IGCSService, useClass: GCSService },
  ],
  exports: [MongooseModule, JwtModule, IUserRepository, IAccountRepository, IEntityRepository, IGCSService],
})
export class InfraModule {}
