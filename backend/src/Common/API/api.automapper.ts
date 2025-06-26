import { createMap, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { CreateUserRequest, UpdateUserRequest } from "src/Features/Registration/Requests/user.requests";
import { SignInRequest } from "src/Features/Auth/Requests/auth.requests";
import { UserEntity } from "src/Common/Infrastructure/DB/Entities/user.entity";
import { UserModel } from "src/Common/API/REST/RestModels/user.models";

@Injectable()
export class ApiAutomapperRegistration extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      // Entity to Model mappings
      createMap(mapper, UserEntity, UserModel);
      
      // Add other simple mappings as needed
      // Most of the complex CQRS mappings are no longer needed
    };
  }
}
