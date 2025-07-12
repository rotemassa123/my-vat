import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi, type LoginCredentials, type AuthResponse } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';

export const useLogin = () => {
  const { login: loginUser, setLoading: setAuthLoading, setError: setAuthError } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError } = useProfileStore();

  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: authApi.login,
    onMutate: () => {
      setAuthLoading(true);
      setProfileLoading(true);
      setAuthError(null);
      setProfileError(null);
    },
    onSuccess: async (authResponse: AuthResponse) => {
      // Step 1: Set user state. Session is managed by an HTTP-only cookie.
      loginUser(authResponse);
      
      // Step 2: Fetch profile data
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
      } catch (profileError) {
        console.error('Profile loading failed after successful login:', profileError);
        const errorMessage = profileError instanceof Error ? profileError.message : 'Failed to load profile';
        setProfileError(errorMessage);
        // Also set auth error to reflect the incomplete login
        setAuthError(errorMessage); 
      } finally {
        // Step 3: Finalize loading states
        setAuthLoading(false);
        setProfileLoading(false);
      }
    },
    onError: (error: Error) => {
      console.error('Login mutation failed:', error);
      setAuthError(error.message);
      clearProfile();
      setAuthLoading(false);
      setProfileLoading(false);
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