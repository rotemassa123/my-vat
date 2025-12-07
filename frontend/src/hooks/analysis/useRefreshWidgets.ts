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

    // Trigger refresh immediately
    refreshWidgets();
  }, [filtersKey, refreshWidgets]);

  return {
    isRefreshing: isPending,
    error,
  };
};

