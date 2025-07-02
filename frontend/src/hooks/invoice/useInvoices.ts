import { useQuery } from '@tanstack/react-query';
import { invoiceApi } from '../../lib/invoiceApi';
import type { Invoice, PaginatedResponse, InvoiceQueryParams } from '../../types/api';

export const useInvoices = (params?: InvoiceQueryParams) => {
  const { data, isLoading, isError, error, refetch } = useQuery<
    PaginatedResponse<Invoice>,
    Error
  >({
    queryKey: ['invoices', params],
    queryFn: () => invoiceApi.getInvoices(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    invoices: data?.data || [],
    totalCount: data?.metadata?.total || 0,
    pagination: {
      limit: data?.metadata?.limit || 10,
      skip: data?.metadata?.skip || 0,
      count: data?.metadata?.count || 0,
    },
    isLoading,
    isError,
    error,
    refetch,
  };
}; 