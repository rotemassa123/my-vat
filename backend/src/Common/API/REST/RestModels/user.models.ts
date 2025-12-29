import { AutoMap } from "@automapper/classes";
import { UserRole } from "src/Common/consts/userRole";

export class UserModel {
  @AutoMap()
  public userId: number;

  @AutoMap()
  public fullName: string;

  @AutoMap()
  public profileImageUrl?: string;

  @AutoMap()
  public userType: UserRole;
}
