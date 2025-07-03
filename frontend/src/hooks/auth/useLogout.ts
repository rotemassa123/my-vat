import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi } from '../../lib/authApi';

export const useLogout = () => {
  const navigate = useNavigate();
  const { logout: logoutAuth } = useAuthStore();
  const { clearProfile } = useProfileStore();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      // Always clear local state and redirect, even if API call fails
      logoutAuth();
      clearProfile();
      
      // Clear any additional storage if needed
      sessionStorage.removeItem('auth-storage');
      sessionStorage.removeItem('profile-storage');
      
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout API call failed:', error);
      // Don't throw error - we still want to clear local state
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    logout,
    isLoading: logoutMutation.isPending,
    error: logoutMutation.error,
  };
}; 