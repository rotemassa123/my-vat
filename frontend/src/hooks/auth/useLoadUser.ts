import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { authApi } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';
import { loadAllData } from '../../services/invoiceService';

export const useLoadUser = () => {
  const { login: loginUser, logout: logoutUser, setLoading: setAuthLoading, setError: setAuthError } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError, account: currentAccount } = useAccountStore();

  const loadUserMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Check if we have a valid session
      const authResponse = await authApi.me();
      
      // Step 2: Load profile data
      const profileData = await profileApi.getProfile();
      
      // Step 3: Always load invoices during login to ensure spinner stays active
      // This ensures the login spinner waits for both profile and invoices requests
      let dataResult = null;
      console.log('🔄 Loading invoices data during login...');
      try {
        dataResult = await loadAllData();
        console.log('✅ Successfully loaded invoices during login');
      } catch (error) {
        console.warn('⚠️ Failed to load data during auth, will retry later:', error);
        // Don't fail the entire auth flow if data loading fails
      }
      
      return { auth: authResponse, profile: profileData, data: dataResult };
    },
    onMutate: () => {
      // Always set loading when called from login flow to ensure spinner stays active
      // This ensures the spinner continues until both profile and invoices requests complete
      setAuthLoading(true);
      if (!currentAccount) {
        setProfileLoading(true);
      }
      setAuthError(null);
      setProfileError(null);
    },
    onSuccess: ({ auth, profile, data }) => {
      // Only update state if we got valid data
      loginUser(auth);
      setProfile(profile);
      setAuthLoading(false);
      setProfileLoading(false);
      
      if (data) {
        console.log('🎉 Successfully loaded user and data:', {
          user: auth.fullName,
          invoices: data.invoices.length,
        });
      }
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
