export interface User {
  _id: string;
  fullName: string;
  email: string;
  userType: 'operator' | 'admin' | 'member' | 'guest';
  accountId: string;
  entityId: string;
  profile_image_url?: string;
} 