import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../lib/apiClient';

export const useAuth = () => {
  const { setUser, setAuthenticated, clearAuth } = useAuthStore();
  
  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: async () => {
      return apiClient.get('/auth/me');
    },
    onSuccess: async (response) => {
      const userData = response.data;
      setUser(userData);
      setAuthenticated(true);
    },
    onError: (err) => {
      clearAuth();
    },
  });

  useEffect(() => {
    mutate();
  }, []);

  return {
    isLoading: isPending,
    isError,
    error,
    mutate,
  };
};
