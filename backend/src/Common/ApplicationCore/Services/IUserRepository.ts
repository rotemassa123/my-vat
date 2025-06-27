import { UserType } from "src/Common/consts/userType";
import { Types } from "mongoose";

export interface UserData {
  userId: number;
  fullName: string;
  email: string;
  password: string;
  userType: UserType;
  accountId: string;
  status: string;
  last_login?: Date;
  permissions: string[];
  verified_at?: Date;
  profile_image_url?: string;
  phone?: string;
  department?: string;
  role?: string;
}

export interface CreateUserData {
  userId: number;
  fullName: string;
  email: string;
  password: string;
  userType: UserType;
  accountId: string;
  status?: string;
  permissions?: string[];
  phone?: string;
  department?: string;
  role?: string;
}

export interface UpdateUserData {
  fullName?: string;
  email?: string;
  password?: string;
  userType?: UserType;
  status?: string;
  permissions?: string[];
  profile_image_url?: string;
  phone?: string;
  department?: string;
  role?: string;
}

export abstract class IUserRepository {
  abstract findUserById(userId: number): Promise<UserData | null>;
  abstract createUser(userData: CreateUserData): Promise<UserData>;
  abstract updateUser(userId: number, updateData: UpdateUserData): Promise<boolean>;
  abstract deleteUser(userId: number): Promise<boolean>;
  abstract userExists(userId: number): Promise<boolean>;
} 