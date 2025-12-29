import { UserRole } from '../consts/userType';

export interface User {
  _id: string;
  fullName?: string; // Changed to optional to match backend
  email: string;
  userType: UserRole;
  accountId: string;
  entityId: string;
  status: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
} 