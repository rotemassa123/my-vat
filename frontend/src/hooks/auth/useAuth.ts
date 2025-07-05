import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi, type AuthResponse } from '../../lib/authApi';

export const useAuth = () => {
  const { 
    isAuthenticated, 
    loading: authLoading, 
    error: authError, 
    login: loginStore, 
    logout: logoutStore 
  } = useAuthStore();

  const { loading: profileLoading, error: profileError } = useProfileStore();

  // Use mutation instead of query to avoid reactive re-enabling
  const { mutate: verifyAuth, isPending: isVerifying } = useMutation<AuthResponse, Error>({
    mutationFn: authApi.me,
    onSuccess: () => {
      loginStore();
    },
    onError: () => {
      logoutStore();
    },
  });

  // Verify auth only once on mount - never again
  useEffect(() => {
    if (!isAuthenticated) {
      verifyAuth();
    }
  }, []); // Empty dependency array - run once on mount

  // Combined loading state
  const isLoading = authLoading || isVerifying || profileLoading;

  return {
    // Auth state
    isAuthenticated,
    isLoading,
    error: authError || profileError,
  };
}; 