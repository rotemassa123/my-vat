import { useEffect, useRef, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { widgetApi } from '../../lib/widgetApi';
import { useAnalysisFiltersStore } from '../../store/analysisFiltersStore';
import { useWidgetStore } from '../../store/widgetStore';

/**
 * Hook to refresh widgets when global filters change
 * Debounces filter changes to avoid too many refreshes
 */
export const useRefreshWidgets = () => {
  const filters = useAnalysisFiltersStore((state) => state.filters);
  const { setWidgets } = useWidgetStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const previousFiltersRef = useRef<string>('');

  // Create a stable string representation of filters for comparison
  const filtersKey = useMemo(() => {
    return JSON.stringify({
      entityIds: filters.entityIds?.sort() || [],
      country: filters.country || '',
      dateRange: filters.dateRange
        ? {
            start: filters.dateRange.start.toISOString(),
            end: filters.dateRange.end.toISOString(),
          }
        : null,
    });
  }, [filters]);

  const { mutate: refreshWidgets, isPending, error } = useMutation({
    mutationFn: () => widgetApi.refreshAll(filters),
    onSuccess: (updatedWidgets) => {
      setWidgets(updatedWidgets);
    },
    onError: (error) => {
      console.error('Failed to refresh widgets:', error);
    },
  });

  useEffect(() => {
    // Skip refresh on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousFiltersRef.current = filtersKey;
      return;
    }

    // Only refresh if filters actually changed
    if (previousFiltersRef.current === filtersKey) {
      return;
    }

    previousFiltersRef.current = filtersKey;

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce: wait 500ms after last filter change before refreshing
    debounceTimerRef.current = setTimeout(() => {
      refreshWidgets();
    }, 500);

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filtersKey, refreshWidgets]);

  return {
    isRefreshing: isPending,
    error,
  };
};

