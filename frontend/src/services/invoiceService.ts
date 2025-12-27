import { reportingApi } from '../lib/reportingApi';
import type { ReportingInvoice } from '../types/reporting';

class InvoiceService {
  private static instance: InvoiceService;
  
  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  /**
   * Load all invoices with embedded extracted data using React-friendly recursive batching
   */
  private async fetchAllInvoices(): Promise<ReportingInvoice[]> {
    const batchSize = 500;
    
      console.log('🔄 Starting to fetch all invoices with extracted data...');

    const fetchBatch = async (skip: number, totalCount?: number): Promise<ReportingInvoice[]> => {
      // Yield to event loop to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 0));
      
      try {
        // Invoice already has all extracted fields embedded
        const response = await reportingApi.getReportingData({
          skip,
          limit: batchSize,
          sort_by: 'created_at',
          sort_order: 'desc',
        });

        // Update progress
        const currentTotal = totalCount || response.metadata.total;
        const currentCount = skip + response.data.length;
        const progress = Math.min((currentCount / currentTotal) * 100, 100);
        const { useInvoiceStore } = await import('../store/invoiceStore');
        useInvoiceStore.getState().setLoadingProgress(progress);

        console.log(`📊 Fetched ${response.data.length} invoices (${currentCount}/${currentTotal} total)`);

        // Base case: no more data or reached safety limit
        const hasMore = response.data.length === batchSize && 
                       currentCount < currentTotal &&
                       skip < 50000; // Safety limit

        if (!hasMore) {
          console.log('✅ Finished fetching all invoices');
          return response.data;
        }

        // Recursive case: fetch next batch and combine
        const nextBatch = await fetchBatch(skip + batchSize, currentTotal);
        return [...response.data, ...nextBatch];

      } catch (error) {
        console.error(`❌ Failed to fetch batch at skip ${skip}:`, error);
        throw error;
      }
    };

    return fetchBatch(0);
  }

  /**
   * Main function to load all invoice data
   */
  async loadAllData(): Promise<{ invoices: ReportingInvoice[] }> {
    const { useInvoiceStore } = await import('../store/invoiceStore');
    const store = useInvoiceStore.getState();
    
    try {
      store.setIsLoading(true);
      store.setError(null);
      store.setLoadingProgress(0);

      console.log('🚀 Starting invoice data load...');

      // Fetch all invoices (with embedded extracted fields)
      const invoices = await this.fetchAllInvoices();

      console.log(`✅ Successfully loaded ${invoices.length} invoices`);

      // Store the data
      store.setInvoices(invoices);
      store.setLastUpdated(Date.now());
      store.setLoadingProgress(100);

      return { invoices };

    } catch (error) {
      console.error('❌ Failed to load invoice data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      store.setError(errorMessage);
      throw error;
    } finally {
      store.setIsLoading(false);
    }
  }

  /**
   * Force refresh all data (invalidate cache)
   */
  async refreshAllData(): Promise<{ invoices: ReportingInvoice[] }> {
    console.log('🔄 Force refreshing all invoice data...');
    const { useInvoiceStore } = await import('../store/invoiceStore');
    const store = useInvoiceStore.getState();
    store.setCacheVersion(Date.now().toString()); // Invalidate cache
    return this.loadAllData();
  }

  /**
   * Check if data loading is needed based on cache
   */
  async isDataLoadingNeeded(): Promise<boolean> {
    const { useInvoiceStore } = await import('../store/invoiceStore');
    const store = useInvoiceStore.getState();
    const { invoices, lastUpdated, cacheTtl } = store;
    
    // No data loaded
    if (!invoices.length) return true;
    
    // Cache expired
    if (lastUpdated && Date.now() - lastUpdated > cacheTtl) return true;
    
    return false;
  }

  /**
   * Get current data status
   */
  async getDataStatus() {
    const { useInvoiceStore } = await import('../store/invoiceStore');
    const store = useInvoiceStore.getState();
    return {
      isLoading: store.isLoading,
      error: store.error,
      invoiceCount: store.invoices.length,
      lastUpdated: store.lastUpdated,
      loadingProgress: store.loadingProgress,
    };
  }
}

// Export singleton instance
export const invoiceService = InvoiceService.getInstance();

// Export convenience functions
export const loadAllData = () => invoiceService.loadAllData();
export const refreshAllData = () => invoiceService.refreshAllData();
export const isDataLoadingNeeded = () => invoiceService.isDataLoadingNeeded();
export const getDataStatus = () => invoiceService.getDataStatus();

// Components can import useInvoiceStore directly from '../store/invoiceStore' 