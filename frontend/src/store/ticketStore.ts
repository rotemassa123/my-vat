import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Ticket } from '../services/tickets.service';

// Comprehensive ticket state
interface TicketStore {
  // Raw data
  tickets: Ticket[];
  
  // Loading states
  isLoading: boolean;
  loadingProgress: number;
  
  // Error states
  error: string | null;
  
  // Cache management
  lastUpdated: number | null;
  cacheVersion: string;
  cacheTtl: number; // Time to live in milliseconds
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;
  setCacheVersion: (version: string) => void;
  
  // Computed getters
  getTotalTicketCount: () => number;
  getTicketById: (id: string) => Ticket | undefined;
  
  // Cache management
  refreshData: () => Promise<void>;
}

// Cache constants
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_VERSION = 'v1.0.0'; // Increment when data structure changes

// Create the store
export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tickets: [],
      isLoading: false,
      loadingProgress: 0,
      error: null,
      lastUpdated: null,
      cacheVersion: CACHE_VERSION,
      cacheTtl: CACHE_TTL,
      
      // Actions
      setTickets: (tickets) => set({ tickets }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setLoadingProgress: (progress) => set({ loadingProgress: progress }),
      setError: (error) => set({ error }),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
      setCacheVersion: (version) => set({ cacheVersion: version }),
      
      // Computed getters
      getTotalTicketCount: () => get().tickets.length,
      getTicketById: (id: string) => get().tickets.find((t) => t.id === id),
      
      // Cache management
      refreshData: async () => {
        // Import dynamically to avoid circular dependency
        const { loadAllTickets } = await import('../services/ticketService');
        await loadAllTickets();
      },
    }),
    {
      name: 'ticket-store',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist essential data, not computed values
      partialize: (state) => ({
        tickets: state.tickets,
        lastUpdated: state.lastUpdated,
        cacheVersion: state.cacheVersion,
      }),
      // Reset cache if version changes
      migrate: (persistedState: any, version) => {
        if (persistedState?.cacheVersion !== CACHE_VERSION) {
          console.log('🔄 Ticket store version changed, clearing cache');
          return {
            tickets: [],
            isLoading: false,
            loadingProgress: 0,
            error: null,
            lastUpdated: null,
            cacheVersion: CACHE_VERSION,
            cacheTtl: CACHE_TTL,
          };
        }
        return persistedState;
      },
    }
  )
);

