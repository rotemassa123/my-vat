export interface User {
  _id: string;
  fullName: string;
  email: string;
  userType: number;
  accountId: string;
  entityId: string;
  status: string;
  profile_image_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
} 