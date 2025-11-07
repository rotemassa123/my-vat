import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import { authApi } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';
import { loadAllData } from '../../services/invoiceService';
import { UserType } from '../../consts/userType';

export const useLoadUser = () => {
  const { login: loginUser, logout: logoutUser, setLoading: setAuthLoading, setError: setAuthError } = useAuthStore();
  const { setProfile, clearProfile, setLoading: setProfileLoading, setError: setProfileError, account: currentAccount } = useAccountStore();
  const { setAccountsAndEntities: setOperatorAccountsAndEntities, setLoading: setOperatorAccountsLoading, setError: setOperatorAccountsError, clearAccounts: clearOperatorAccounts } = useOperatorAccountsStore();

  const loadUserMutation = useMutation({
    mutationFn: async () => {
      // Step 1: Check if we have a valid session
      const authResponse = await authApi.me();
      
      // Step 2: Load profile data
      const profileData = await profileApi.getProfile();
      
      // Step 3: Load operator accounts and entities (only for operators)
      let operatorAccountsData = null;
      let operatorEntitiesData = null;
      if (authResponse.userType === UserType.operator) {
        try {
          [operatorAccountsData, operatorEntitiesData] = await Promise.all([
            profileApi.getAllAccounts(),
            profileApi.getAllEntities(),
          ]);
          console.log('✅ Successfully loaded operator accounts:', operatorAccountsData.length, 'and entities:', operatorEntitiesData.length);
        } catch (error) {
          console.warn('⚠️ Failed to load operator accounts/entities, will retry later:', error);
          // Don't fail the entire auth flow if operator accounts loading fails
        }
      }
      
      // Step 4: Always load invoices during login to ensure spinner stays active
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
      
      return { auth: authResponse, profile: profileData, operatorAccounts: operatorAccountsData, operatorEntities: operatorEntitiesData, data: dataResult };
    },
    onMutate: () => {
      // Always set loading when called from login flow to ensure spinner stays active
      // This ensures the spinner continues until both profile and invoices requests complete
      setAuthLoading(true);
      if (!currentAccount) {
        setProfileLoading(true);
      }
      setOperatorAccountsLoading(true);
      setAuthError(null);
      setProfileError(null);
      setOperatorAccountsError(null);
    },
    onSuccess: ({ auth, profile, operatorAccounts, operatorEntities, data }) => {
      // Only update state if we got valid data
      loginUser(auth);
      setProfile(profile);
      setAuthLoading(false);
      setProfileLoading(false);
      
      // Set operator accounts and entities if user is operator and we have data
      if (auth.userType === UserType.operator) {
        if (operatorAccounts && operatorEntities) {
          setOperatorAccountsAndEntities(operatorAccounts, operatorEntities);
          console.log('🎉 Successfully loaded operator accounts:', operatorAccounts.length, 'and entities:', operatorEntities.length);
        }
        setOperatorAccountsLoading(false);
      } else {
        // Clear operator accounts for non-operators
        clearOperatorAccounts();
        setOperatorAccountsLoading(false);
      }
      
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
      clearOperatorAccounts();
      
      // Don't set errors for expected 401s
      if (error.message !== 'Request failed with status code 401') {
        setAuthError(error.message);
        setProfileError(error.message);
        setOperatorAccountsError(error.message);
      }
      
      setAuthLoading(false);
      setProfileLoading(false);
      setOperatorAccountsLoading(false);
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
