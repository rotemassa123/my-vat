import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/authApi';

export const useLogout = () => {
  const queryClient = useQueryClient();
  const { logout: logoutStore } = useAuthStore();

  // Logout mutation
  const { mutateAsync, isPending } = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutStore();
      // Clear all cached queries
      queryClient.clear();
    },
    onError: (error) => {
      // Even if logout fails, clear local state
      console.error('Logout error:', error);
      logoutStore();
      queryClient.clear();
    },
  });

  const handleLogout = async () => {
    try {
      await mutateAsync();
    } catch (error) {
      // Error is handled in onError callback
      console.error('Logout failed:', error);
    }
  };

  return {
    logout: handleLogout,
    isLoading: isPending,
  };
}; 