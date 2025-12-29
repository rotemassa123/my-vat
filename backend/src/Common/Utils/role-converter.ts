import { UserRole } from '../consts/userRole';

// Conversion functions removed - UserRole is now used directly throughout the codebase

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

