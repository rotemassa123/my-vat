import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi, type LoginCredentials, type AuthResponse } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';

export const useLogin = () => {
  const { login: loginAuth, setLoading: setAuthLoading, setError: setAuthError } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError } = useProfileStore();

  const loginMutation = useMutation<AuthResponse, Error, LoginCredentials>({
    mutationFn: authApi.login,
    onMutate: () => {
      // Set loading states
      setAuthLoading(true);
      setProfileLoading(true);
      // Clear any previous errors
      setAuthError(null);
      setProfileError(null);
    },
    onSuccess: async (authResponse) => {
      try {        
        loginAuth(authResponse.token);
        setAuthLoading(false);
        
        const profileData = await profileApi.getCombinedProfile(authResponse.user._id);
                
        setProfile(profileData);
        setProfileLoading(false);
      } catch (profileError) {
        // Profile loading failed, but user is still authenticated
        console.error('Profile loading failed after successful login:', profileError);
        setProfileError(profileError instanceof Error ? profileError.message : 'Failed to load profile');
        setProfileLoading(false);
      }
    },
    onError: (error) => {
      // Authentication failed
      console.error('Login failed:', error);
      setAuthError(error.message);
      setAuthLoading(false);
      setProfileLoading(false);
      clearProfile();
    },
  });

  const login = (credentials: LoginCredentials) => {
    loginMutation.mutate(credentials);
  };

  return {
    login,
    isLoading: loginMutation.isPending,
    error: loginMutation.error,
    isSuccess: loginMutation.isSuccess,
    reset: loginMutation.reset,
  };
}; 