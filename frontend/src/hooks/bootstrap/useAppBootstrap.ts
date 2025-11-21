import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { authApi } from '../../lib/authApi';
import { profileApi } from '../../lib/profileApi';
import { loadAllData as loadInvoices } from '../../services/invoiceService';
import { loadAllWidgets as loadWidgets } from '../../services/widgetService';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { useOperatorAccountsStore } from '../../store/operatorAccountsStore';
import { UserType } from '../../consts/userType';
import type { User } from '../../types/user';

export type BootstrapStageStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppBootstrapState {
  mandatoryStatus: BootstrapStageStatus;
  mandatoryError: string | null;
  secondaryStatus: BootstrapStageStatus;
  secondaryError: string | null;
  refresh: () => Promise<void>;
}

const isUnauthorized = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 401;

export const useAppBootstrap = (): AppBootstrapState => {
  const {
    setUser,
    setAuthenticated,
    clearAuth,
    user: authUser,
    isAuthenticated,
  } = useAuthStore();
  const {
    setProfile,
    setError: setProfileError,
    clearProfile,
  } = useAccountStore();
  const {
    setAccountsAndEntities,
    setError: setOperatorError,
    clearAccounts,
  } = useOperatorAccountsStore();

  const [mandatoryStatus, setMandatoryStatus] =
    useState<BootstrapStageStatus>('idle');
  const [mandatoryError, setMandatoryError] = useState<string | null>(null);
  const [secondaryStatus, setSecondaryStatus] =
    useState<BootstrapStageStatus>('idle');
  const [secondaryError, setSecondaryError] = useState<string | null>(null);

  const secondaryController = useRef<AbortController | null>(null);

  const runSecondaryStage = useCallback(
    async (user: User | null) => {
      secondaryController.current?.abort();
      const controller = new AbortController();
      secondaryController.current = controller;

      setSecondaryStatus('loading');
      setSecondaryError(null);

      if (!user) {
        setSecondaryStatus('success');
        return;
      }

      try {
        if (controller.signal.aborted) {
          return;
        }

        if (user.userType === UserType.operator) {
          setOperatorError(null);

          const [accounts, entities] = await Promise.all([
            profileApi.getAllAccounts(),
            profileApi.getAllEntities(),
          ]);

          if (!controller.signal.aborted) {
            setAccountsAndEntities(accounts, entities);
          }
        } else {
          clearAccounts();
        }

        // Load invoices and widgets in parallel (non-blocking)
        // Fire both off without blocking - they'll load in the background
        void Promise.all([
          loadInvoices(),
          loadWidgets(),
        ]).catch((error) => {
          // Log errors but don't block bootstrap
          console.error('Background data loading failed:', error);
        });

        if (!controller.signal.aborted) {
          setSecondaryStatus('success');
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Secondary bootstrap stage failed:', error);
        setOperatorError(
          error instanceof Error ? error.message : 'Failed to load operator data',
        );
        setSecondaryStatus('error');
        setSecondaryError(
          error instanceof Error ? error.message : 'Failed to load background data',
        );
      }
    },
    [
      clearAccounts,
      setAccountsAndEntities,
      setOperatorError,
    ],
  );

  const runBootstrap = useCallback(async () => {
    secondaryController.current?.abort();

    setMandatoryStatus('loading');
    setMandatoryError(null);
    setProfileError(null);

    try {
      const me = await authApi.me();
      setUser(me);
      setAuthenticated(true);

      const profile = await profileApi.getProfile();
      setProfile(profile);

      setMandatoryStatus('success');
      setMandatoryError(null);

      void runSecondaryStage(me);
    } catch (error) {
      if (isUnauthorized(error)) {
        clearAuth();
        clearProfile();
        clearAccounts();
        setMandatoryStatus('success');
        setSecondaryStatus('idle');
        setMandatoryError(null);
      } else {
        console.error('Mandatory bootstrap stage failed:', error);
        setMandatoryStatus('error');
        setMandatoryError(
          error instanceof Error ? error.message : 'Failed to load required data',
        );
        setProfileError(
          error instanceof Error ? error.message : 'Failed to load required data',
        );
      }
    } finally {
      /* no-op: loading handled by bootstrap state */
    }
  }, [
    clearAccounts,
    clearAuth,
    clearProfile,
    runSecondaryStage,
    setAuthenticated,
    setProfile,
    setProfileError,
    setUser,
  ]);

  useEffect(() => {
    runBootstrap();
    return () => secondaryController.current?.abort();
  }, [runBootstrap]);

  useEffect(() => {
    // If authentication state changes (e.g., logout), adjust secondary stage
    if (!isAuthenticated) {
      secondaryController.current?.abort();
      setSecondaryStatus('idle');
      setSecondaryError(null);
      clearAccounts();
    } else if (mandatoryStatus === 'success') {
      void runSecondaryStage(authUser);
    }
  }, [authUser, clearAccounts, isAuthenticated, mandatoryStatus, runSecondaryStage]);

  return {
    mandatoryStatus,
    mandatoryError,
    secondaryStatus,
    secondaryError,
    refresh: runBootstrap,
  };
};

