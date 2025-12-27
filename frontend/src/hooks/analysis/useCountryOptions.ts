import { useQuery } from '@tanstack/react-query';
import { reportingApi } from '../../lib/reportingApi';
import type { ReportingResponse } from '../../types/reporting';

/**
 * Hook to fetch unique countries from invoices
 * Caches results to avoid unnecessary refetches
 */
export const useCountryOptions = () => {
  const { data, isLoading, error } = useQuery<string[], Error>({
    queryKey: ['country-options'],
    queryFn: async () => {
      // Fetch invoices with a reasonable limit to get unique countries
      const response = await reportingApi.getReportingData({
        limit: 1000, // Get enough invoices to find unique countries
        skip: 0,
      }) as ReportingResponse;

      // Extract unique countries from invoices
      const countries = new Set<string>();
      response.data.forEach((invoice) => {
        const country = invoice.country;
        if (country && country.trim().length > 0) {
          countries.add(country.trim());
        }
      });

      // Return sorted array of unique countries
      return Array.from(countries).sort();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });

  return {
    countries: data || [],
    isLoading,
    error,
  };
};

