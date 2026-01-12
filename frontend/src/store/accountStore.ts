import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User } from '../types/user';
import { type Account, type Entity, type ComprehensiveProfile, type Statistics } from '../types/profile';

export type { ComprehensiveProfile };

// Default statistics data with all zeros
const getDefaultStatisticsData = (): Record<string, any> => ({
  total_claimed: 0,
  total_refunded: 0,
  pending_amount: 0,
  rejected_amount: 0,
  refunded_percentage: 0,
  pending_percentage: 0,
  rejected_percentage: 0,
  total_claims_count: 0,
  refunded_count: 0,
  pending_count: 0,
  rejected_count: 0,
});

// Create default statistics for an entity
const createDefaultStatistics = (entityId: string): Statistics => ({
  entity_id: entityId,
  data: getDefaultStatisticsData(),
});

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
  updateUser: (userId: string, updates: Partial<User>) => void;
  removeUser: (userId: string) => void;
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
      setProfile: (profile) => {
        const entities = profile.entities ?? [];
        const statistics = profile.statistics ?? [];
        
        const defaultStatistics: Statistics[] = entities.length > 0 && statistics.length === 0
          ? entities.map(entity => createDefaultStatistics(entity._id))
          : statistics;
        
        set({
          account: profile.account ?? null,
          entities,
          users: profile.users ?? [],
          statistics: defaultStatistics,
          error: null,
        });
      },
      
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
      
      // User management
      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(user =>
          user._id === userId ? { ...user, ...updates } : user
        ),
      })),
      
      removeUser: (userId) => set((state) => ({
        users: state.users.filter(user => user._id !== userId),
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

