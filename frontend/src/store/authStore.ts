import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  account_id: string;
  email: string;
  name: string;
  permissions: string[];
  auth_providers: string[];
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthStore>(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        error: null 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      clearAuth: () => set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: null 
      }),
      
      login: (user) => set({ 
        user, 
        isAuthenticated: true, 
        loading: false, 
        error: null 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false, 
        error: null 
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
); 