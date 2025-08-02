import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Invoice, InvoiceFilters } from '../types/api';

interface InvoiceStore {
  // Data
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  
  // Loading state
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  
  // Cache metadata
  lastLoadTime: number | null;
  cacheVersion: string;
  
  // Filters
  filters: InvoiceFilters;
  searchTerm: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  setInvoices: (invoices: Invoice[]) => void;
  addInvoices: (invoices: Invoice[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  setSearchTerm: (term: string) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  applyFilters: () => void;
  clearFilters: () => void;
  
  // Cache management
  isCacheValid: () => boolean;
  invalidateCache: () => void;
  
  // Selectors
  getTotalCount: () => number;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStatus: (status: string) => Invoice[];
}

// Cache TTL: 30 days in milliseconds
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const CACHE_VERSION = 'v1.0.0';

export const useInvoiceStore = create<InvoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      invoices: [],
      filteredInvoices: [],
      isLoading: false,
      loadingProgress: 0,
      error: null,
      lastLoadTime: null,
      cacheVersion: CACHE_VERSION,
      filters: {},
      searchTerm: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
      
      // Cache management
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        
        // Check version compatibility
        if (state.cacheVersion !== CACHE_VERSION) {
          return false;
        }
        
        // Check if we have data and timestamp
        if (!state.lastLoadTime || state.invoices.length === 0) {
          return false;
        }
        
        // Check TTL
        const age = now - state.lastLoadTime;
        return age < CACHE_TTL;
      },
      
      invalidateCache: () => {
        set({
          invoices: [],
          filteredInvoices: [],
          lastLoadTime: null,
          error: null,
        });
      },
      
      // Actions
      setInvoices: (invoices) => {
        set({ 
          invoices,
          lastLoadTime: Date.now(),
          cacheVersion: CACHE_VERSION,
        });
        get().applyFilters();
      },
      
      addInvoices: (newInvoices) => {
        const existingIds = new Set(get().invoices.map(inv => inv._id));
        const uniqueInvoices = newInvoices.filter(inv => !existingIds.has(inv._id));
        
        set(state => ({
          invoices: [...state.invoices, ...uniqueInvoices],
          lastLoadTime: Date.now(),
          cacheVersion: CACHE_VERSION,
        }));
        get().applyFilters();
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
      setError: (error) => set({ error }),
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
        get().applyFilters();
      },
      
      setSearchTerm: (searchTerm) => {
        set({ searchTerm });
        get().applyFilters();
      },
      
      setSorting: (sortBy, sortOrder) => {
        set({ sortBy, sortOrder });
        get().applyFilters();
      },
      
      applyFilters: () => {
        const { invoices, filters, searchTerm, sortBy, sortOrder } = get();
        
        let filtered = [...invoices];
        
        // Apply search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(invoice =>
            invoice.name.toLowerCase().includes(term) ||
            invoice.vendor_name?.toLowerCase().includes(term) ||
            invoice.supplier?.toLowerCase().includes(term) ||
            invoice.invoice_number?.toLowerCase().includes(term) ||
            invoice.description?.toLowerCase().includes(term) ||
            invoice.status.toLowerCase().includes(term)
          );
        }
        
        // Apply status filter
        if (filters.status?.length) {
          filtered = filtered.filter(invoice => 
            filters.status!.includes(invoice.status)
          );
        }
        
        // Apply filename filter (only check name field)
        if (filters.filename) {
          filtered = filtered.filter(invoice =>
            invoice.name.toLowerCase().includes(filters.filename!.toLowerCase())
          );
        }
        
        // Apply vat_scheme filter - map to vat_rate if available
        if (filters.vat_scheme) {
          filtered = filtered.filter(invoice =>
            invoice.vat_rate === filters.vat_scheme
          );
        }
        
        // Apply currency filter
        if (filters.currency) {
          filtered = filtered.filter(invoice =>
            invoice.currency === filters.currency
          );
        }
        
        // Apply date range filter
        if (filters.date_from || filters.date_to) {
          filtered = filtered.filter(invoice => {
            if (!invoice.invoice_date) return false;
            const invDate = new Date(invoice.invoice_date);
            
            if (filters.date_from && invDate < new Date(filters.date_from)) {
              return false;
            }
            if (filters.date_to && invDate > new Date(filters.date_to)) {
              return false;
            }
            return true;
          });
        }
        
        // Apply amount range filter (check both total_amount and net_amount)
        if (filters.min_amount || filters.max_amount) {
          filtered = filtered.filter(invoice => {
            const totalAmount = invoice.total_amount || 0;
            const netAmount = parseFloat(invoice.net_amount || '0');
            const amount = totalAmount || netAmount;
            
            if (filters.min_amount && amount < filters.min_amount) {
              return false;
            }
            if (filters.max_amount && amount > filters.max_amount) {
              return false;
            }
            return true;
          });
        }
        
        // Apply sorting
        filtered.sort((a, b) => {
          const getValue = (invoice: Invoice, field: string) => {
            switch (field) {
              case 'created_at':
              case 'invoice_date':
              case 'claim_submitted_at':
                return new Date(invoice[field as keyof Invoice] as string).getTime();
              case 'total_amount':
              case 'claim_amount':
                return (invoice[field as keyof Invoice] as number) || 0;
              case 'net_amount':
              case 'vat_amount':
                return parseFloat((invoice[field as keyof Invoice] as string) || '0');
              default:
                return (invoice[field as keyof Invoice] as string)?.toLowerCase() || '';
            }
          };
          
          const aVal = getValue(a, sortBy);
          const bVal = getValue(b, sortBy);
          
          if (sortOrder === 'asc') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
          }
        });
        
        set({ filteredInvoices: filtered });
      },
      
      clearFilters: () => {
        set({
          filters: {},
          searchTerm: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
        });
        get().applyFilters();
      },
      
      // Selectors
      getTotalCount: () => get().invoices.length,
      
      getInvoiceById: (id) => {
        return get().invoices.find(invoice => invoice._id === id);
      },
      
      getInvoicesByStatus: (status) => {
        return get().invoices.filter(invoice => invoice.status === status);
      },
    }),
    {
      name: 'invoice-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        invoices: state.invoices,
        lastLoadTime: state.lastLoadTime,
        cacheVersion: state.cacheVersion,
      }),
    }
  )
); 