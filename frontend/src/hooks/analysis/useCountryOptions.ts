import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/apiClient';

interface SummaryResponse {
  summary_content?: {
    country?: string;
  };
}

interface SummaryListResponse {
  data: SummaryResponse[];
  metadata: {
    total: number;
  };
}

/**
 * Hook to fetch unique countries from summaries
 * Caches results to avoid unnecessary refetches
 */
export const useCountryOptions = () => {
  const { data, isLoading, error } = useQuery<string[], Error>({
    queryKey: ['country-options'],
    queryFn: async () => {
      // Fetch summaries with a reasonable limit to get unique countries
      const response = await apiClient.get<SummaryListResponse>('/summaries', {
        params: {
          limit: 1000, // Get enough summaries to find unique countries
          skip: 0,
        },
      });

      // Extract unique countries from summaries
      const countries = new Set<string>();
      response.data.data.forEach((summary) => {
        const country = summary.summary_content?.country;
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

