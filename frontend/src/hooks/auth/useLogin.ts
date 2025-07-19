import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi, type LoginCredentials, type AuthResponse } from '../../lib/authApi';
import { useLoadUser } from './useLoadUser';

export const useLogin = () => {
  const { setLoading: setAuthLoading, setError: setAuthError } = useAuthStore();
  const { clearProfile } = useProfileStore();
  const { loadUser } = useLoadUser();

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

  return {
    login: loginMutation.mutate,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
    isSuccess: loginMutation.isSuccess,
    reset: loginMutation.reset,
  };
};
