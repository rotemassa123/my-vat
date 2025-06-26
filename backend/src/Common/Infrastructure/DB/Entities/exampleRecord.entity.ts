import { AutoMap } from '@automapper/classes';

export class ExampleRecordEntity {
  @AutoMap()
  public Key: string;

  @AutoMap()
  public Value: string;
}
