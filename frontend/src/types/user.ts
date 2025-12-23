export interface User {
  _id: string;
  fullName?: string; // Changed to optional to match backend
  email: string;
  userType: number;
  accountId: string;
  entityId: string;
  status: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
} 