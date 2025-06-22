import { useInfiniteQuery } from '@tanstack/react-query';
import { InvoiceApiService } from '../lib/invoiceApi';
import type { InvoiceQueryParams, PaginatedResponse, Invoice } from '../types/api';

export const useInfiniteInvoices = (params: Omit<InvoiceQueryParams, 'page'> = {}) => {
  return useInfiniteQuery<PaginatedResponse<Invoice>, Error, any, [string, Omit<InvoiceQueryParams, 'page'>], number>({
    queryKey: ['invoices-infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      InvoiceApiService.getInvoices({ ...params, page: pageParam, per_page: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.has_next ? lastPage.page + 1 : undefined;
    },
    getPreviousPageParam: (firstPage) => {
      return firstPage.has_prev ? firstPage.page - 1 : undefined;
    },
  });
};

// Note: Individual invoice and stats queries can be added back if needed
// For now, focusing on the infinite scroll list 