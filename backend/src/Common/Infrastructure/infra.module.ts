import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InfraAutomapperRegistration } from "./infra.automapper";
import { JwtModule } from "@nestjs/jwt";
import { jwtModuleOptionsFactory } from "src/Common/Infrastructure/Config/Jwt.config";
import { typeOrmModuleOptionsFactory } from "src/Common/Infrastructure/Config/typeOrm.config";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { ProjectEntity } from "src/Common/Infrastructure/DB/Entities/project.entity";
import { StageEntity } from "src/Common/Infrastructure/DB/Entities/stage.entity";
import { StepEntity } from "src/Common/Infrastructure/DB/Entities/step.entity";
import { DatabaseInitializerService } from "src/Common/DB/DatabaseInitializerService";
import { FavoriteProjectsEntity } from "./DB/Entities/favoriteProjects.entity";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptionsFactory),
    TypeOrmModule.forFeature([
      UserEntity,
      ProjectEntity,
      StageEntity,
      StepEntity,
      FavoriteProjectsEntity,
    ]),
    JwtModule.registerAsync(jwtModuleOptionsFactory),
  ],
  providers: [InfraAutomapperRegistration, DatabaseInitializerService],
  exports: [TypeOrmModule, JwtModule],
})
export class InfraModule {}
