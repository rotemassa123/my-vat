import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { authApi, type LoginCredentials, type AuthResponse } from '../../lib/authApi';
import { useLoadUser } from './useLoadUser';

export const useLogin = () => {
  const { setLoading: setAuthLoading, setError: setAuthError, loading: authLoading } = useAuthStore();
  const { clearProfile } = useAccountStore();
  const { loadUser, isLoading: loadUserLoading } = useLoadUser();

  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: authApi.login,
    onMutate: () => {
      setAuthLoading(true);
      setAuthError(null);
    },
    onSuccess: async () => {
      // After successful login, trigger the unified load flow
      loadUser();
    },
    onError: (error: Error) => {
      console.error('Login mutation failed:', error);
      setAuthError(error.message);
      clearProfile();
      setAuthLoading(false);
    },
  });

  // isLoading should be true if either login is pending OR loadUser is loading
  // This ensures the spinner stays until both requests complete
  const isLoading = loginMutation.isPending || loadUserLoading || authLoading;

  return {
    login: loginMutation.mutate,
    isLoading,
    error: loginMutation.error,
    isSuccess: loginMutation.isSuccess,
    reset: loginMutation.reset,
  };
};
