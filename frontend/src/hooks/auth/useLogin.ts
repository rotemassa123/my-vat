import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import {
  authApi,
  type AuthResponse,
  type LoginCredentials,
} from '../../lib/authApi';
import { useAccountStore } from '../../store/accountStore';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import { useAppBootstrapContext } from '../../contexts/AppBootstrapContext';

export const useLogin = () => {
  const { login: setAuthUser, setError: setAuthError, clearAuth } = useAuthStore();
  const { clearProfile } = useAccountStore();
  const { clearAccounts } = useOperatorAccountsStore();
  const { refresh: refreshBootstrap } = useAppBootstrapContext();

  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: authApi.login,
    onMutate: () => {
      setAuthError(null);
    },
    onSuccess: async (user) => {
      setAuthUser(user);
      clearProfile();
      clearAccounts();
      try {
        await refreshBootstrap();
      } catch (error) {
        console.error('Bootstrap refresh after login failed:', error);
      }
    },
    onError: (error: Error) => {
      console.error('Login mutation failed:', error);
      setAuthError(error.message);
      clearAuth();
      clearProfile();
      clearAccounts();
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
