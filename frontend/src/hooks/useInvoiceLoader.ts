import { useCallback, useEffect, useRef } from 'react';
import { InvoiceApiService } from '../lib/invoiceApi';
import { useInvoiceStore } from '../lib/invoiceStore';
import type { Invoice } from '../types/api';

interface InvoiceLoaderOptions {
  batchSize?: number;
  maxInvoices?: number;
  autoLoad?: boolean;
  account_id?: string;
}

export const useInvoiceLoader = ({
  batchSize = 2000,
  maxInvoices = 10000,
  autoLoad = true,
  account_id = ''
}: InvoiceLoaderOptions = {}) => {
  const {
    isLoading,
    loadingProgress,
    error,
    setLoading,
    setLoadingProgress,
    setError,
    setInvoices,
    getTotalCount,
    isCacheValid,
    invalidateCache
  } = useInvoiceStore();
  
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasCheckedCache = useRef(false);

  const loadInvoices = useCallback(async (forceRefresh = false) => {
    if (loadingRef.current) return;
    
    // Check cache validity first (unless forced refresh)
    if (!forceRefresh && isCacheValid()) {
      console.log('📦 Using cached invoice data');
      return;
    }
    
    console.log('🔄 Loading fresh invoice data from API');
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
    // Clear existing data if doing a full refresh
    if (forceRefresh) {
      setInvoices([]);
    }
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      let page = 1;
      let totalLoaded = 0;
      let hasMore = true;
      const allInvoices: Invoice[] = [];
      
      while (hasMore && totalLoaded < maxInvoices) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        // Calculate remaining items to load
        const remaining = maxInvoices - totalLoaded;
        const currentBatchSize = Math.min(batchSize, remaining);
        
        // Fetch batch
        const response = await InvoiceApiService.getCombinedInvoices({
          account_id,
          limit: currentBatchSize,
          skip: (page - 1) * currentBatchSize,
        });
        
        const batchInvoices = response.data;
        
        if (batchInvoices.length === 0) {
          hasMore = false;
          break;
        }
        
        // Add to local array
        allInvoices.push(...batchInvoices);
        totalLoaded += batchInvoices.length;
        
        // Update progress
        const estimatedTotal = Math.min(response.metadata.total, maxInvoices);
        const progress = Math.round((totalLoaded / estimatedTotal) * 100);
        setLoadingProgress(progress);
        
        // Check if we've loaded enough or if there are no more items
        if (batchInvoices.length < currentBatchSize || totalLoaded >= maxInvoices) {
          hasMore = false;
        }
        
        page++;
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Set all invoices at once (this will update cache timestamp)
      if (allInvoices.length > 0) {
        setInvoices(allInvoices);
      } else {
        // Even if no invoices, update the cache timestamp
        setInvoices([]);
      }
      
      setLoadingProgress(100);
      
      // Give a brief moment to show 100% before finishing
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Invoice loading was cancelled');
      } else {
        console.error('Failed to load invoices:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [batchSize, maxInvoices, setLoading, setLoadingProgress, setError, setInvoices, isCacheValid, account_id]);

  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const refreshInvoices = useCallback(() => {
    loadInvoices(true); // Force refresh
  }, [loadInvoices]);

  const clearAndReload = useCallback(() => {
    cancelLoading();
    invalidateCache();
    hasCheckedCache.current = false;
    loadInvoices(true);
  }, [cancelLoading, invalidateCache, loadInvoices]);

  // Auto-load logic: Check cache and load if needed (run once)
  useEffect(() => {
    if (autoLoad && !hasCheckedCache.current) {
      hasCheckedCache.current = true;
      
      // Load invoices if cache is invalid or empty
      if (!isCacheValid() || getTotalCount() === 0) {
        loadInvoices();
      }
    }
  }, [autoLoad, isCacheValid, getTotalCount, loadInvoices]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelLoading();
    };
  }, [cancelLoading]);

  return {
    // Loading state
    isLoading,
    loadingProgress,
    error,
    
    // Data info
    totalCount: getTotalCount(),
    hasData: getTotalCount() > 0,
    isCacheValid: isCacheValid(),
    isReady: !isLoading && (isCacheValid() || hasCheckedCache.current),
    
    // Actions
    loadInvoices,
    refreshInvoices,
    clearAndReload,
    cancelLoading,
  };
}; 