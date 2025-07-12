import { useAuthStore } from '../../store/authStore';

export const useAuth = () => {
  const { 
    isAuthenticated, 
    loading: authLoading, 
    isHydrating,
    user,
    error,
  } = useAuthStore();

  // The true loading state is a combination of the store's loading flag and its hydration status
  const isLoading = authLoading || isHydrating;

  return {
    isAuthenticated,
    isLoading,
    user,
    error,
  };
}; 