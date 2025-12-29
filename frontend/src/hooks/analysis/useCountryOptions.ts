import { useMemo } from 'react';
import { useInvoiceStore } from '../../store/invoiceStore';

/**
 * Hook to get unique countries from invoices in the store
 * No API request needed - uses data already loaded in the store
 */
export const useCountryOptions = () => {
  const invoices = useInvoiceStore((state) => state.invoices);
  const isLoading = useInvoiceStore((state) => state.isLoading);

  // Extract unique countries from invoices in the store
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    invoices.forEach((invoice) => {
      const country = invoice.country;
      if (country && country.trim().length > 0) {
        countrySet.add(country.trim());
      }
    });
    return Array.from(countrySet).sort();
  }, [invoices]);

  return {
    countries,
    isLoading,
    error: null,
  };
};

