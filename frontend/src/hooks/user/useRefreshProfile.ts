import { useCallback } from 'react';
import { profileApi } from '../../lib/profileApi';
import { useProfileStore } from '../../store/profileStore';

export const useRefreshProfile = () => {
  const { setProfile, setLoading, setError } = useProfileStore();

  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profileData = await profileApi.getProfile();
      setProfile(profileData);
      console.log('Profile refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh profile');
    } finally {
      setLoading(false);
    }
  }, [setProfile, setLoading, setError]);

  return {
    refreshProfile,
  };
};
