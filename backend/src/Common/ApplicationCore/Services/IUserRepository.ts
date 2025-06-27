import { UserType } from "src/Common/consts/userType";

export interface UserData {
  userId: number;
  fullName: string;
  password: string;
  userType: UserType;
  projects?: any[];
}

export interface CreateUserData {
  userId: number;
  fullName: string;
  password: string;
  userType: UserType;
  projects?: any[];
}

export interface UpdateUserData {
  fullName?: string;
  password?: string;
  userType?: UserType;
}

export abstract class IUserRepository {
  abstract findUserById(userId: number): Promise<UserData | null>;
  abstract createUser(userData: CreateUserData): Promise<UserData>;
  abstract updateUser(userId: number, updateData: UpdateUserData): Promise<boolean>;
  abstract deleteUser(userId: number): Promise<boolean>;
  abstract userExists(userId: number): Promise<boolean>;
} 