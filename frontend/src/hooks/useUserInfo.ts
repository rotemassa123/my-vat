import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';
import type { User } from '../types/user';

/**
 * Hook to fetch and cache user information by user ID
 * Caches results to avoid repeated API calls for the same user
 */
export const useUserInfo = (userId: string | null | undefined) => {
  return useQuery({
    queryKey: ['user-info', userId],
    queryFn: async (): Promise<User | null> => {
      if (!userId) return null;
      
      try {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data as User;
      } catch (error: any) {
        // If user not found, return null instead of throwing
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

