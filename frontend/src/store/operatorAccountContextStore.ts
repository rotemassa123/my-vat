import { create } from 'zustand';

interface OperatorAccountContextStore {
  selectedAccountId: string | null;
  setSelectedAccountId: (accountId: string | null) => void;
  clearSelectedAccount: () => void;
}

/**
 * Store to track the currently selected account when operator is managing a client
 * This is used to set the x-account-id header in API requests
 */
export const useOperatorAccountContextStore = create<OperatorAccountContextStore>((set) => ({
  selectedAccountId: null,
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  clearSelectedAccount: () => set({ selectedAccountId: null }),
}));

