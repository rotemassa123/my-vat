import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnalysisFiltersStore } from '../../store/analysisFiltersStore';

/**
 * Hook to sync global filters with URL query parameters
 * Reads filters from URL on mount and updates URL when filters change
 */
export const useGlobalFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setEntityIds, setCountry, setDateRange, clearFilters } = useAnalysisFiltersStore();
  const isInitialMount = useRef(true);

  // Read filters from URL on mount
  useEffect(() => {
    const entityIdsParam = searchParams.get('entityIds');
    const countryParam = searchParams.get('country');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (entityIdsParam) {
      setEntityIds(entityIdsParam.split(',').filter(id => id.trim().length > 0));
    }
    if (countryParam) {
      setCountry(countryParam);
    }
    if (startDateParam || endDateParam) {
      setDateRange({
        start: startDateParam ? new Date(startDateParam) : new Date(0),
        end: endDateParam ? new Date(endDateParam) : new Date(),
      });
    }
    
    isInitialMount.current = false;
  }, []); // Only run on mount

  // Update URL when filters change (but not on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      return;
    }

    const newSearchParams = new URLSearchParams(searchParams);

    // Update entityIds
    if (filters.entityIds && filters.entityIds.length > 0) {
      newSearchParams.set('entityIds', filters.entityIds.join(','));
    } else {
      newSearchParams.delete('entityIds');
    }

    // Update country
    if (filters.country) {
      newSearchParams.set('country', filters.country);
    } else {
      newSearchParams.delete('country');
    }

    // Update date range
    if (filters.dateRange) {
      newSearchParams.set('startDate', filters.dateRange.start.toISOString().split('T')[0]);
      newSearchParams.set('endDate', filters.dateRange.end.toISOString().split('T')[0]);
    } else {
      newSearchParams.delete('startDate');
      newSearchParams.delete('endDate');
    }

    // Only update if something changed
    const currentParams = searchParams.toString();
    const newParams = newSearchParams.toString();
    if (currentParams !== newParams) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  return {
    filters,
    setEntityIds,
    setCountry,
    setDateRange,
    clearFilters,
  };
};

