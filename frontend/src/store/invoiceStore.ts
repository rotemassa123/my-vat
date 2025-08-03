import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ReportingInvoice } from '../types/reporting';

// Comprehensive invoice state
interface InvoiceStore {
  // Raw data
  invoices: ReportingInvoice[];
  
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
  setInvoices: (invoices: ReportingInvoice[]) => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (timestamp: number) => void;
  setCacheVersion: (version: string) => void;
  
  // Computed getters
  getTotalInvoiceCount: () => number;
  
  // Cache management
  refreshData: () => Promise<void>;
}

// Cache constants
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_VERSION = 'v3.0.0'; // Increment when data structure changes

// Create the store
export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      isLoading: false,
      loadingProgress: 0,
      error: null,
      lastUpdated: null,
      cacheVersion: CACHE_VERSION,
      cacheTtl: CACHE_TTL,
      
      // Actions
      setInvoices: (invoices) => set({ invoices }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setLoadingProgress: (progress) => set({ loadingProgress: progress }),
      setError: (error) => set({ error }),
      setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
      setCacheVersion: (version) => set({ cacheVersion: version }),
      
      // Computed getters
      getTotalInvoiceCount: () => get().invoices.length,
      
      // Cache management
      refreshData: async () => {
        // Import dynamically to avoid circular dependency
        const { refreshAllData } = await import('../services/invoiceService');
        await refreshAllData();
      },
    }),
    {
      name: 'invoice-store',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist essential data, not computed values
      partialize: (state) => ({
        invoices: state.invoices,
        lastUpdated: state.lastUpdated,
        cacheVersion: state.cacheVersion,
      }),
      // Reset cache if version changes
      migrate: (persistedState: any, version) => {
        if (persistedState?.cacheVersion !== CACHE_VERSION) {
          console.log('🔄 Invoice store version changed, clearing cache');
          return {
            invoices: [],
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