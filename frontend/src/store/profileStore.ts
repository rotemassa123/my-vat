import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User } from '../types/user';
import { type Account, type Entity, type ComprehensiveProfile } from '../types/profile';

export type { ComprehensiveProfile };

interface ProfileStore {
  // State
  account: Account | null;
  entities: Entity[];
  users: User[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: ComprehensiveProfile) => void;
  setAccount: (account: Account | null) => void;
  setEntities: (entities: Entity[]) => void;
  addEntity: (entity: Entity) => void;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  removeEntity: (entityId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearProfile: () => void;
}

export const useProfileStore = create(
  persist<ProfileStore>(
    (set) => ({
      // Initial state
      account: null,
      entities: [],
      users: [],
      loading: false,
      error: null,

      // Set complete profile data
      setProfile: (profile) => set({
        account: profile.account ?? null,
        entities: profile.entities ?? [],
        users: profile.users ?? [],
        error: null,
      }),
      
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
      
      // Loading and error states
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      // Clear all profile data
      clearProfile: () => set({
        account: null,
        entities: [],
        users: [],
        loading: false,
        error: null,
      }),
    }),
    {
      name: 'profile-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
); 