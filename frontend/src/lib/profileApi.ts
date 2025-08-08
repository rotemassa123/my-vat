import apiClient from './apiClient';

export interface DeleteUserResponse {
  success: boolean;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  user: any;
}

export interface UploadProfileImageResponse {
  profileImageUrl: string;
}

export interface DeleteProfileImageResponse {
  success: boolean;
}

export const profileApi = {
  getProfile: async (): Promise<any> => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  uploadProfileImage: async (formData: FormData): Promise<UploadProfileImageResponse> => {
    const response = await apiClient.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProfileImage: async (): Promise<DeleteProfileImageResponse> => {
    const response = await apiClient.delete('/profile/delete-image');
    return response.data;
  },
  
  deleteUser: async (userId: string): Promise<DeleteUserResponse> => {
    try {
      const response = await apiClient.delete<DeleteUserResponse>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete users');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Failed to delete user');
      }
      throw new Error('An error occurred while deleting the user');
    }
  },

  updateUserRole: async (userId: string, userType: number, entityId?: string): Promise<UpdateUserRoleResponse> => {
    try {
      const requestBody: { userType: number; entityId?: string } = { userType };
      if (entityId) {
        requestBody.entityId = entityId;
      }
      
      const response = await apiClient.put<UpdateUserRoleResponse>(`/users/${userId}/role`, requestBody);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update user roles');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Failed to update user role');
      }
      throw new Error('An error occurred while updating the user role');
    }
  },

  updateUserEntity: async (userId: string, entityId: string): Promise<UpdateUserRoleResponse> => {
    try {
      const response = await apiClient.put<UpdateUserRoleResponse>(`/users/${userId}/entity`, {
        entityId
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update user entities');
      }
      if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Failed to update user entity');
      }
      throw new Error('An error occurred while updating the user entity');
    }
  },
}; 