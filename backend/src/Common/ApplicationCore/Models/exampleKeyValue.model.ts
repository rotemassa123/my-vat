import { AutoMap } from '@automapper/classes';

export class ExampleKeyValueModel {
  @AutoMap()
  public Key: string;

  @AutoMap()
  public Value: string;
}
