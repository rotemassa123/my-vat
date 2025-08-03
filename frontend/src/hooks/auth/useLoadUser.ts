import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useProfileStore } from '../../store/profileStore';
import { authApi } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';
import { loadAllData, isDataLoadingNeeded } from '../../services/invoiceService';

export const useLoadUser = () => {
  const { login: loginUser, logout: logoutUser, setLoading: setAuthLoading, setError: setAuthError, user: currentUser } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError, account: currentAccount } = useProfileStore();

  const loadUserMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Check if we have a valid session
      const authResponse = await authApi.me();
      
      // Step 2: Load profile data
      const profileData = await profileApi.getProfile();
      
      // Step 3: Load all invoices and summaries if needed
      let dataResult = null;
      if (await isDataLoadingNeeded()) {
        console.log('🔄 Data loading needed, fetching all data...');
        try {
          dataResult = await loadAllData();
        } catch (error) {
          console.warn('⚠️ Failed to load data during auth, will retry later:', error);
          // Don't fail the entire auth flow if data loading fails
        }
      } else {
        console.log('📦 Data is cached and valid, skipping data load');
      }
      
      return { auth: authResponse, profile: profileData, data: dataResult };
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
