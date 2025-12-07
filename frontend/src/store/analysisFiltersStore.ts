import { create } from 'zustand';

export interface GlobalFilters {
  entityIds?: string[];
  country?: string;
  dateRange?: { start: Date; end: Date };
}

interface AnalysisFiltersState {
  filters: GlobalFilters;
  setEntityIds: (entityIds: string[] | undefined) => void;
  setCountry: (country: string | undefined) => void;
  setDateRange: (dateRange: { start: Date; end: Date } | undefined) => void;
  clearFilters: () => void;
}

export const useAnalysisFiltersStore = create<AnalysisFiltersState>((set) => ({
  filters: {},
  
  setEntityIds: (entityIds) =>
    set((state) => ({
      filters: {
        ...state.filters,
        entityIds: entityIds && entityIds.length > 0 ? entityIds : undefined,
      },
    })),
  
  setCountry: (country) =>
    set((state) => ({
      filters: {
        ...state.filters,
        country: country || undefined,
      },
    })),
  
  setDateRange: (dateRange) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: dateRange || undefined,
      },
    })),
  
  clearFilters: () =>
    set({
      filters: {},
    }),
}));

