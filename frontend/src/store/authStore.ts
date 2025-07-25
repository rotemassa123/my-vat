import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { type User } from '../types/user';

interface AuthStore {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  user: User | null;
  
  // Actions
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      isAuthenticated: false,
      loading: false,
      error: null,
      user: null,

      setAuthenticated: (isAuthenticated) => set({ 
        isAuthenticated,
        error: null 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setUser: (user) => set({ user }),
      
      clearAuth: () => set({ 
        isAuthenticated: false, 
        loading: false, 
        error: null,
        user: null,
      }),
      
      login: (user) => set({ 
        isAuthenticated: true,
        error: null,
        user: user,
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        loading: false, 
        error: null,
        user: null,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
