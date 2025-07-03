import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;
  
  // Actions
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
  login: (token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create(
  persist<AuthStore>(
    (set) => ({
      isAuthenticated: false,
      loading: false,
      error: null,
      token: null,

      setAuthenticated: (isAuthenticated) => set({ 
        isAuthenticated,
        error: null 
      }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      setToken: (token) => set({ token }),
      
      clearAuth: () => set({ 
        isAuthenticated: false, 
        loading: false, 
        error: null,
        token: null,
      }),
      
      login: (token) => set({ 
        isAuthenticated: true, 
        loading: false, 
        error: null,
        token: token || null,
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        loading: false, 
        error: null,
        token: null,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
); 