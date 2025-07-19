import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useLoadUser } from './useLoadUser';

export const useAppInit = () => {
  const { user, loading: authLoading, isHydrating } = useAuthStore();
  const { loadUser } = useLoadUser();

  useEffect(() => {
    console.log('useAppInit: isHydrating:', isHydrating, 'authLoading:', authLoading, 'user:', !!user);
    
    // Only run after store has hydrated from sessionStorage
    if (isHydrating) {
      console.log('useAppInit: Still hydrating, skipping...');
      return;
    }

    // Check if we have stored session data
    const hasValidSession = () => {
      const stored = sessionStorage.getItem('auth-storage');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.state?.isAuthenticated === true && parsed.state?.user;
        } catch {
          return false;
        }
      }
      return false;
    };

    const hasSession = hasValidSession();
    console.log('useAppInit: hasSession:', hasSession, 'user:', !!user);

    // Only load user if:
    // 1. We have session data
    // 2. We're not already loading
    // 3. We don't already have user data loaded
    if (!authLoading && hasSession && !user) {
      console.log('useAppInit: Loading user from stored session');
      loadUser();
    } else {
      console.log('useAppInit: Skipping load - authLoading:', authLoading, 'hasSession:', hasSession, 'user:', !!user);
    }
  }, [isHydrating, authLoading, user, loadUser]);
};
