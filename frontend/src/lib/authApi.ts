import apiClient from './apiClient';
import { type User } from '../types/user';

// The response from the /login endpoint is the user object itself.
export type AuthResponse = User;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  company_name?: string;
}

// Auth API functions
export const authApi = {
  // Check authentication status
  me: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  // Refresh token (if needed)
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
}; 