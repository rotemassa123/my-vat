import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';

export const useLoadUser = () => {
  const { login: loginUser, logout: logoutUser, setLoading: setAuthLoading, setError: setAuthError, user: currentUser } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError, account: currentAccount } = useProfileStore();

  const loadUserMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Check if we have a valid session
      const authResponse = await authApi.me();
      
      // Step 2: Load profile data
      const profileData = await profileApi.getProfile();
      
      return { auth: authResponse, profile: profileData };
    },
    onMutate: () => {
      // Only set loading if we don't already have data
      if (!currentUser) {
        setAuthLoading(true);
      }
      if (!currentAccount) {
        setProfileLoading(true);
      }
      setAuthError(null);
      setProfileError(null);
    },
    onSuccess: ({ auth, profile }) => {
      // Only update state if we got valid data
      loginUser(auth);
      setProfile(profile);
      setAuthLoading(false);
      setProfileLoading(false);
    },
    onError: (error: Error) => {
      console.error('Load user failed:', error);
      
      // Clear all state on error (user is not authenticated)
      logoutUser();
      clearProfile();
      
      // Don't set errors for expected 401s
      if (error.message !== 'Request failed with status code 401') {
        setAuthError(error.message);
        setProfileError(error.message);
      }
      
      setAuthLoading(false);
      setProfileLoading(false);
    },
  });

  return {
    loadUser: loadUserMutation.mutate,
    isLoading: loadUserMutation.isPending,
    error: loadUserMutation.error,
    isSuccess: loadUserMutation.isSuccess,
    reset: loadUserMutation.reset,
  };
};
