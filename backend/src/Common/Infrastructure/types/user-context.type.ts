import { UserType } from '../../consts/userType';

export interface UserContext {
  accountId?: string;
  userId?: string;
  userType?: UserType;
  entityId?: string;
  impersonatedBy?: string;
}

