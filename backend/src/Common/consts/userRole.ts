/**
 * User role enum matching upload-to-cloud UserRole
 * Values are stored as strings in the database
 */
export enum UserRole {
  OPERATOR = 'operator',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

