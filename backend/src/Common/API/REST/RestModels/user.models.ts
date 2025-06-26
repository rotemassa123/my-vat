import { AutoMap } from "@automapper/classes";
import { UserType } from "src/Common/consts/userType";

export class UserModel {
  @AutoMap()
  public userId: number;

  @AutoMap()
  public fullName: string;

  @AutoMap()
  public profileImageUrl?: string;

  @AutoMap()
  public userType: UserType;
}
