/**
 * User role enum matching backend UserRole
 * Values are stored as strings in the database
 */
export enum UserRole {
  OPERATOR = 'operator',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

