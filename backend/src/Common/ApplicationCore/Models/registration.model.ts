import { AutoMap } from '@automapper/classes';

export class CreateUserModel {
  @AutoMap()
  public Key: string;

  @AutoMap()
  public Value: string;
}
