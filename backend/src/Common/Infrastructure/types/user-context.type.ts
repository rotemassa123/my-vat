import { UserRole } from '../../consts/userRole';

export interface UserContext {
  accountId?: string;
  userId?: string;
  userType?: UserRole;
  entityId?: string;
  impersonatedBy?: string;
}

