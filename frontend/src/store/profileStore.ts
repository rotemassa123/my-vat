import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Type definitions based on backend responses
export interface User {
  _id: string;
  fullName: string;
  email: string;
  userType: 'admin' | 'member' | 'guest';
  accountId: string;
  status: string;
  last_login?: Date;
  profile_image_url?: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Account {
  _id: string;
  email: string;
  account_type: 'individual' | 'business';
  status: 'active' | 'inactive' | 'suspended';
  company_name?: string;
  tax_id?: string;
  vat_number?: string;
  registration_number?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  website?: string;
  vat_settings: {
    default_currency: string;
    vat_rate: number;
    reclaim_threshold: number;
    auto_process: boolean;
  };
  last_login?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface Entity {
  _id: string;
  accountId: string;
  name: string;
  entity_type?: 'company' | 'subsidiary' | 'branch' | 'partnership' | 'sole_proprietorship';
  registration_number?: string;
  incorporation_date?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  email?: string;
  vat_settings?: {
    vat_number?: string;
    tax_id?: string;
    vat_rate?: number;
    currency?: string;
    filing_frequency?: 'monthly' | 'quarterly' | 'annually';
  };
  status: 'active' | 'inactive' | 'dissolved';
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface CombinedProfile {
  user: User;
  account: Account;
  entities: Entity[];
}

interface ProfileStore {
  // State
  user: User | null;
  account: Account | null;
  entities: Entity[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setProfile: (profile: CombinedProfile) => void;
  setUser: (user: User | null) => void;
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
      user: null,
      account: null,
      entities: [],
      loading: false,
      error: null,

      // Set complete profile data
      setProfile: (profile) => set({
        user: profile.user,
        account: profile.account,
        entities: profile.entities,
        loading: false,
        error: null,
      }),

      // Set individual data
      setUser: (user) => set({ user }),
      
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
        user: null,
        account: null,
        entities: [],
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