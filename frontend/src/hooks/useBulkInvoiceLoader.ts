import { useCallback, useEffect, useRef } from 'react';
import { InvoiceApiService } from '../lib/invoiceApi';
import { useInvoiceStore } from '../lib/invoiceStore';
import type { Invoice } from '../types/api';

interface BulkLoadOptions {
  batchSize?: number;
  maxInvoices?: number;
  autoStart?: boolean;
  account_id?: number; // Required for combined endpoint
}

export const useBulkInvoiceLoader = ({
  batchSize = 2000,
  maxInvoices = 10000,
  autoStart = true,
  account_id = 1 // Default account_id, should be passed from context/auth
}: BulkLoadOptions = {}) => {
  const {
    isLoading,
    loadingProgress,
    error,
    setLoading,
    setLoadingProgress,
    setError,
    addInvoices,
    getTotalCount
  } = useInvoiceStore();
  
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitialized = useRef(false); // Track if we've already tried to load

  const loadInvoices = useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    setLoadingProgress(0);
    
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
        
        // Add to store in batches for better performance
        if (allInvoices.length >= batchSize || batchInvoices.length < currentBatchSize) {
          addInvoices([...allInvoices]);
          allInvoices.length = 0; // Clear the array
        }
        
        // Check if we've loaded enough or if there are no more items
        if (batchInvoices.length < currentBatchSize || totalLoaded >= maxInvoices) {
          hasMore = false;
        }
        
        page++;
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Add any remaining invoices
      if (allInvoices.length > 0) {
        addInvoices(allInvoices);
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
  }, [batchSize, maxInvoices, setLoading, setLoadingProgress, setError, addInvoices, account_id]);

  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const resetAndReload = useCallback(() => {
    cancelLoading();
    // Clear the store and reload
    useInvoiceStore.getState().setInvoices([]);
    hasInitialized.current = false; // Reset initialization flag
    loadInvoices();
  }, [cancelLoading, loadInvoices]);

  // Auto-start loading ONCE when the hook is first mounted
  useEffect(() => {
    if (autoStart && !hasInitialized.current && getTotalCount() === 0 && !isLoading) {
      hasInitialized.current = true; // Mark as initialized
      loadInvoices();
    }
  }, [autoStart]); // Only depend on autoStart - run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelLoading();
    };
  }, [cancelLoading]);

  return {
    isLoading,
    loadingProgress,
    error,
    totalLoaded: getTotalCount(),
    loadInvoices,
    cancelLoading,
    resetAndReload
  };
}; 