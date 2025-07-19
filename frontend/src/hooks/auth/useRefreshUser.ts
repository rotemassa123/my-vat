import { useLoadUser } from './useLoadUser';

export const useRefreshUser = () => {
  const { loadUser, isLoading, error } = useLoadUser();

  const refreshUser = () => {
    loadUser();
  };

  return {
    refreshUser,
    isLoading,
    error,
  };
};
