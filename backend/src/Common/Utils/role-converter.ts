import { UserType } from '../consts/userType';
import { UserRole } from '../consts/userRole';

/**
 * Converts UserType enum to UserRole enum
 */
export function userTypeToRole(userType: UserType): UserRole {
  const map: Record<UserType, UserRole> = {
    [UserType.operator]: UserRole.OPERATOR,
    [UserType.admin]: UserRole.ADMIN,
    [UserType.member]: UserRole.MEMBER,
    [UserType.viewer]: UserRole.VIEWER,
  };
  return map[userType] || UserRole.MEMBER;
}

/**
 * Converts UserRole enum to UserType enum
 */
export function roleToUserType(role: UserRole): UserType {
  const map: Record<UserRole, UserType> = {
    [UserRole.OPERATOR]: UserType.operator,
    [UserRole.ADMIN]: UserType.admin,
    [UserRole.MEMBER]: UserType.member,
    [UserRole.VIEWER]: UserType.viewer,
  };
  return map[role] || UserType.member;
}

/**
 * Converts UserRole enum to numeric string (for token encoding)
 */
export function roleToNumericString(role: UserRole): string {
  const map: Record<UserRole, string> = {
    [UserRole.OPERATOR]: '0',
    [UserRole.ADMIN]: '1',
    [UserRole.MEMBER]: '2',
    [UserRole.VIEWER]: '3',
  };
  return map[role] || '2';
}

/**
 * Converts numeric string to UserRole enum
 */
export function numericStringToRole(numeric: string): UserRole {
  const map: Record<string, UserRole> = {
    '0': UserRole.OPERATOR,
    '1': UserRole.ADMIN,
    '2': UserRole.MEMBER,
    '3': UserRole.VIEWER,
  };
  return map[numeric] || UserRole.MEMBER;
}

