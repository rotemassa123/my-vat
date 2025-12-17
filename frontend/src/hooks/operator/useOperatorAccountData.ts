import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '../../lib/profileApi';
import { useAccountStore } from '../../store/accountStore';
import { refreshAllData } from '../../services/invoiceService';
import type { ComprehensiveProfile } from '../../types/profile';

/**
 * Hook to fetch and populate account data when operator selects an account
 * This populates the accountStore and invoiceStore with data for the selected account
 */
export const useOperatorAccountData = (accountId: string | null) => {
  const { setProfile } = useAccountStore();

  // Fetch profile data for the selected account
  // Note: The x-account-id header is automatically added by apiClient interceptor
  // from useOperatorAccountContextStore, which is set when account is selected
  const profileQuery = useQuery<ComprehensiveProfile>({
    queryKey: ['operator-account-profile', accountId],
    queryFn: async () => {
      if (!accountId) {
        throw new Error('Account ID is required');
      }
      // This request will include x-account-id header via apiClient interceptor
      // The profile response includes account, entities, users, and statistics
      return profileApi.getProfile();
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load invoices for the selected account
  // refreshAllData already updates the invoiceStore internally
  const invoiceQuery = useQuery({
    queryKey: ['operator-account-invoices', accountId],
    queryFn: async () => {
      if (!accountId) {
        return { invoices: [] };
      }
      // This will use the x-account-id header set by the interceptor
      // refreshAllData internally updates the invoiceStore
      return refreshAllData();
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Update accountStore when profile data is fetched
  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data, setProfile]);

  return {
    profileLoading: profileQuery.isLoading,
    invoiceLoading: invoiceQuery.isLoading,
    profileError: profileQuery.error,
    invoiceError: invoiceQuery.error,
    isLoaded: !profileQuery.isLoading && !invoiceQuery.isLoading && !!profileQuery.data,
  };
};

