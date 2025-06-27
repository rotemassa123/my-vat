import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { InfraAutomapperRegistration } from "./infra.automapper";
import { JwtModule } from "@nestjs/jwt";
import { jwtModuleOptionsFactory } from "src/Common/Infrastructure/Config/Jwt.config";
import { MongooseConfigService } from "src/Common/Infrastructure/Config/mongoose.config";
import { User, UserSchema } from "src/Common/Infrastructure/DB/schemas/user.schema";
import { Project, ProjectSchema } from "src/Common/Infrastructure/DB/schemas/project.schema";
import { Stage, StageSchema } from "src/Common/Infrastructure/DB/schemas/stage.schema";
import { Step, StepSchema } from "src/Common/Infrastructure/DB/schemas/step.schema";  
import { IUserRepository } from "src/Common/ApplicationCore/Services/IUserRepository";
import { UserMongoRepository } from "src/Common/Infrastructure/Services/UserMongoService";
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
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Stage.name, schema: StageSchema },
      { name: Step.name, schema: StepSchema },
    ]),
    JwtModule.registerAsync(jwtModuleOptionsFactory),
  ],
  providers: [
    InfraAutomapperRegistration,
    { provide: IUserRepository, useClass: UserMongoRepository },
    { provide: IGCSService, useClass: GCSService },
  ],
  exports: [MongooseModule, JwtModule, IUserRepository, IGCSService],
})
export class InfraModule {}
