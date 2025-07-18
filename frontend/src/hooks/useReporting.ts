import { useState, useCallback, useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import { useAuthStore } from '../store/authStore';
import { reportingApi } from '../lib/reportingApi';
import type { 
  ReportingFilters, 
  ReportingSortConfig, 
  ReportingPageData 
} from '../types/reporting';

interface UseReportingOptions {
  pageSize?: number;
  initialFilters?: ReportingFilters;
  enabled?: boolean;
}

export const useReporting = ({
  pageSize = 100,
  initialFilters = {},
  enabled = true,
}: UseReportingOptions = {}) => {
  const { user } = useAuthStore();
  
  const [filters, setFilters] = useState<ReportingFilters>(initialFilters);
  const [sortConfig, setSortConfig] = useState<ReportingSortConfig>({
    field: 'created_at',
    order: 'desc'
  });

  // Debounce filter changes to avoid excessive API calls
  const debouncedFilters = useDebounce(filters, 500);
  const debouncedSort = useDebounce(sortConfig, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery<ReportingPageData>({
    queryKey: [
      'reporting',
      user?.accountId,
      user?.entityId,
      user?.userType,
      debouncedFilters,
      debouncedSort,
      pageSize
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await reportingApi.getReportingData({
        ...debouncedFilters,
        sort_by: debouncedSort.field,
        sort_order: debouncedSort.order,
        skip: pageParam as number,
        limit: pageSize,
      });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const { skip, count, total } = lastPage.metadata;
      const nextSkip = skip + count;
      return nextSkip < total ? nextSkip : undefined;
    },
    enabled: enabled && !!user?.accountId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  });

  // Flatten all pages into a single array
  const allInvoices = useMemo(() => 
    data?.pages.flatMap(page => page.data) || [], 
    [data]
  );

  // Get metadata from first page
  const metadata = data?.pages[0]?.metadata;

  // Filter management
  const updateFilters = useCallback((newFilters: Partial<ReportingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const removeFilter = useCallback((filterKey: keyof ReportingFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[filterKey];
      return newFilters;
    });
  }, []);

  // Sort management
  const updateSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    setSortConfig(prev => ({
      field,
      order: order || (prev.field === field && prev.order === 'desc' ? 'asc' : 'desc')
    }));
  }, []);

  const toggleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  // Load more functionality
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch next page when user scrolls to 80% of loaded data
  const prefetchNext = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      // Prefetch in background without blocking UI
      setTimeout(() => {
        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      }, 100);
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // Data
    invoices: allInvoices,
    totalCount: metadata?.total || 0,
    loadedCount: allInvoices.length,
    
    // Loading states
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    
    // Pagination
    hasMore: hasNextPage,
    loadMore,
    prefetchNext,
    
    // Filtering
    filters,
    updateFilters,
    clearFilters,
    removeFilter,
    
    // Sorting
    sortConfig,
    updateSort,
    toggleSort,
    
    // User context
    userScope: metadata?.user_scope,
    cacheHit: metadata?.cache_hit,
    canViewAllEntities: user?.userType === 1, // 1 = admin
    
    // Actions
    refresh: refetch,
  };
}; 