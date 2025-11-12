import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User } from '../types/user';
import { type Account, type Entity, type ComprehensiveProfile, type Statistics } from '../types/profile';

export type { ComprehensiveProfile };

interface AccountStore {
  // State
  account: Account | null;
  entities: Entity[];
  users: User[];
  statistics: Statistics[];
  error: string | null;
  
  // Actions
  setProfile: (profile: ComprehensiveProfile) => void;
  setAccount: (account: Account | null) => void;
  setEntities: (entities: Entity[]) => void;
  setStatistics: (statistics: Statistics[]) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  removeEntity: (entityId: string) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useAccountStore = create(
  persist<AccountStore>(
    (set) => ({
      // Initial state
      account: null,
      entities: [],
      users: [],
      statistics: [],
      error: null,

      // Set complete profile data
      setProfile: (profile) => set({
        account: profile.account ?? null,
        entities: profile.entities ?? [],
        users: profile.users ?? [],
        statistics: profile.statistics ?? [],
        error: null,
      }),
      
      setStatistics: (statistics) => set({ statistics }),
      
      setAccount: (account) => set({ account }),
      
      setEntities: (entities) => set({ entities }),
      
      // Entity management
      addEntity: (entity) => set((state) => ({
        entities: [...state.entities, entity],
      })),
      
      updateEntity: (entityId, updates) => set((state) => ({
        entities: state.entities.map(entity =>
          entity._id === entityId ? { ...entity, ...updates } : entity
        ),
      })),
      
      removeEntity: (entityId) => set((state) => ({
        entities: state.entities.filter(entity => entity._id !== entityId),
      })),
      
      setError: (error) => set({ error }),
      
      // Clear all profile data
      clearProfile: () => set({
        account: null,
        entities: [],
        users: [],
        statistics: [],
        error: null,
      }),
    }),
    {
      name: 'account-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

