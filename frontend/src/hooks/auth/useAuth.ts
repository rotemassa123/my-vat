import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../lib/authApi';
import { type User } from '../../store/authStore';

export const useAuth = () => {
  const { 
    user, 
    isAuthenticated, 
    loading, 
    error, 
    setUser, 
    setLoading, 
    setError, 
    login: loginStore, 
    logout: logoutStore 
  } = useAuthStore();

  // Auto-verify user on mount
  const { data: userData, isLoading: isVerifying, error: verifyError } = useQuery<User, Error>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !isAuthenticated, // Only run if not already authenticated
    retry: false,
  });

  // Handle auth verification result
  useEffect(() => {
    if (userData) {
      loginStore(userData);
    } else if (verifyError) {
      logoutStore();
    }
  }, [userData, verifyError, loginStore, logoutStore]);

  // Combined loading state
  const isLoading = loading || isVerifying;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    // Methods are available from other hooks
  };
}; 