import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type Account, type Entity } from '../types/profile';

interface OperatorAccountsStore {
  // State
  accounts: Account[];
  entities: Entity[];
  error: string | null;
  
  // Actions
  setAccounts: (accounts: Account[]) => void;
  setEntities: (entities: Entity[]) => void;
  setAccountsAndEntities: (accounts: Account[], entities: Entity[]) => void;
  setError: (error: string | null) => void;
  clearAccounts: () => void;
}

export const useOperatorAccountsStore = create(
  persist<OperatorAccountsStore>(
    (set) => ({
      // Initial state
      accounts: [],
      entities: [],
      error: null,

      // Set accounts
      setAccounts: (accounts) => set({
        accounts,
        error: null,
      }),

      // Set entities
      setEntities: (entities) => set({
        entities,
        error: null,
      }),

      // Set both accounts and entities
      setAccountsAndEntities: (accounts, entities) => set({
        accounts,
        entities,
        error: null,
      }),
      
      setError: (error) => set({ error }),
      
      // Clear all accounts data
      clearAccounts: () => set({
        accounts: [],
        entities: [],
        error: null,
      }),
    }),
    {
      name: 'operator-accounts-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

