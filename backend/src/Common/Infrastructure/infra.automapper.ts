import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import {
  createMap, forMember, mapFrom,
  Mapper
} from '@automapper/core';
import { Injectable } from '@nestjs/common';
import { ExampleRecordEntity } from './DB/Entities/exampleRecord.entity';
import { ExampleKeyValueModel } from '../ApplicationCore/Models/exampleKeyValue.model';
import { UserModel } from "../API/REST/RestModels/user.models";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";

@Injectable()
export class InfraAutomapperRegistration extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper) => {
      createMap(mapper, ExampleRecordEntity, ExampleKeyValueModel);
      createMap(mapper, ExampleKeyValueModel, ExampleRecordEntity);
      
      // UserEntity to UserModel mapping with userType conversion
      createMap(
        mapper,
        UserEntity,
        UserModel,
        forMember(
          (destination) => destination.userType,
          mapFrom((source) => source.userType?.userTypeId ?? 0)
        )
      );
    };
  }
}
