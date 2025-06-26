import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { UserEntity } from "../DB/Entities/user.entity";
import { UserTypeEntity } from "src/Common/Infrastructure/DB/Entities/userTypes.entity";
import { ProjectEntity } from "src/Common/Infrastructure/DB/Entities/project.entity";
import { StageEntity } from "src/Common/Infrastructure/DB/Entities/stage.entity";
import { StepEntity } from "src/Common/Infrastructure/DB/Entities/step.entity";
import { SqliteProjectEntity } from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteProjectEntity";
import { SqliteStageEntity } from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteStageEntity";
import { SqliteStepEntity } from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteStepEntity";
import { SqliteUserEntity } from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteUserEntity";
import { FavoriteProjectsEntity } from "../DB/Entities/favoriteProjects.entity";
import { MeetingEntity } from "../DB/Entities/meeting.entity";
import { MeetingInviteeEntity } from "../DB/Entities/meetingInvitee.entity";

export const createTypeOrmOptions = (
  configService: ConfigService
): TypeOrmModuleOptions => {
  const dbType = configService.get<string>("DB_TYPE") as
    | "mongodb"
    | "postgres"
    | "mysql"
    | "sqlite";

  const entities =
    dbType === "sqlite"
      ? [
          SqliteUserEntity,
          UserTypeEntity,
          SqliteProjectEntity,
          SqliteStageEntity,
          SqliteStepEntity,
        ]
      : [
          UserEntity,
          UserTypeEntity,
          ProjectEntity,
          StageEntity,
          StepEntity,
          FavoriteProjectsEntity,
          MeetingEntity,
          MeetingInviteeEntity
        ];

  return {
    type: dbType,
    host: configService.get<string>("DB_HOST"),
    port: Number(configService.get<string>("DB_PORT")),
    username: configService.get<string>("DB_USERNAME"),
    password: configService.get<string>("DB_PASSWORD"),
    database: configService.get<string>("DB_DATABASE"),
    authSource: "admin",
    entities,
    synchronize: true,
  };
};

export const typeOrmModuleOptionsFactory = {
  provide: "TYPEORM_OPTIONS",
  useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
    createTypeOrmOptions(configService),
  inject: [ConfigService],
};
