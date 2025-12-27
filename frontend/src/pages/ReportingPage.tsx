import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Popover,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { useInvoiceStore } from '../store/invoiceStore';
import { refreshAllData } from '../services/invoiceService';
import { InvoiceApiService } from '../lib/invoiceApi';
import { useDownloadInvoice } from '../hooks/invoice/useDownloadInvoice';
import type { ReportingFilters, ReportingInvoice } from '../types/reporting';
import { ReportingHeader, ReportingTable } from '../components/reporting';
import UploadModal from '../components/UploadModal/UploadModal';
import UploadProgressManager from '../components/UploadProgressManager/UploadProgressManager';
import { UploadProvider } from '../contexts/UploadContext';
import styles from './ReportingPage.module.scss';

// Status configuration moved to ReportingTableRow component

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];

// Local filter and sort types
interface LocalFilters {
  status?: string[];
  vat_scheme?: string[];
  currency?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

// Utility functions for filtering and sorting (moved from store)
const applyInvoiceFilters = (
  invoices: ReportingInvoice[],
  filters: LocalFilters
): ReportingInvoice[] => {
  return invoices.filter(invoice => {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(invoice.status)) return false;
    }
    
    // VAT scheme filter
    if (filters.vat_scheme && filters.vat_scheme.length > 0) {
      if (!invoice.vat_scheme || !filters.vat_scheme.includes(invoice.vat_scheme)) return false;
    }
    
    // Currency filter
    if (filters.currency && filters.currency.length > 0) {
      if (!invoice.currency || !filters.currency.includes(invoice.currency)) return false;
    }
    
    // Date range filter
    if (filters.dateFrom && invoice.invoice_date && invoice.invoice_date < filters.dateFrom) return false;
    if (filters.dateTo && invoice.invoice_date && invoice.invoice_date > filters.dateTo) return false;
    
    // Search term filter (searches in multiple fields)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const searchableFields = [
        invoice.supplier_name,
        invoice.invoice_number,
        invoice.description,
        invoice.supplier,
        invoice.description,
      ].filter(Boolean);
      
      if (!searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      )) return false;
    }
    
    return true;
  });
};

// Helper function to determine calculated status (same logic as in ReportingTableRow)
const determineCalculatedStatus = (invoice: ReportingInvoice): string => {
  // 1. Failed - anyone with a failure
  if (invoice.status === 'failed' || invoice.error_message) {
    return 'failed';
  }

  // 2. Claimable/Unclaimable - based on is_claimable flag (check this BEFORE processing)
  if (invoice.is_claimable === true) {
    return 'claimable';
  } else if (invoice.is_claimable === false) {
    return 'unclaimable';
  }

  // 3. Processing - anyone without a failure and without is_claimable flag
  if (!invoice.error_message && invoice.is_claimable === undefined) {
    return 'processing';
  }

  // 4. Submitted and Refunded - for future implementation
  if (invoice.status === 'submitted') {
    return 'submitted';
  }

  if (invoice.status === 'refunded') {
    return 'refunded';
  }

  // Default fallback
  return 'processing';
};

// Status priority for logical sorting order
const STATUS_PRIORITY = {
  'failed': 1,
  'processing': 2,
  'unclaimable': 3,
  'claimable': 4,
  'submitted': 5,
  'refunded': 6,
};

const sortInvoices = (
  invoices: ReportingInvoice[],
  sortConfig: SortConfig
): ReportingInvoice[] => {
  return [...invoices].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    // Handle special sortable fields
    switch (sortConfig.field) {
      case 'submitted_on':
        // Map submitted_on to status_updated_at
        aValue = a.status_updated_at;
        bValue = b.status_updated_at;
        break;
      case 'vat_amount_numeric':
        // Handle VAT amount as numeric for proper sorting
        aValue = parseFloat(String(a.vat_amount || 0));
        bValue = parseFloat(String(b.vat_amount || 0));
        break;
      case 'status':
        // Use calculated status for sorting with priority order
        aValue = STATUS_PRIORITY[determineCalculatedStatus(a) as keyof typeof STATUS_PRIORITY] || 999;
        bValue = STATUS_PRIORITY[determineCalculatedStatus(b) as keyof typeof STATUS_PRIORITY] || 999;
        break;
      default:
        aValue = a[sortConfig.field as keyof ReportingInvoice];
        bValue = b[sortConfig.field as keyof ReportingInvoice];
        break;
    }
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    // Convert to comparable values
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    // Handle numeric strings (for fields that aren't already numeric)
    if (sortConfig.field !== 'vat_amount_numeric') {
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        aValue = aNum;
        bValue = bNum;
      }
    }
    
    // Sort
    if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });
};

const ReportingPage: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Local page state for filters and sorting
  const [activeFilters, setActiveFilters] = useState<LocalFilters>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    order: 'desc',
  });

  // Get raw invoice data from global store
  const {
    invoices: allInvoicesRaw,
    isLoading,
    error,
    getTotalInvoiceCount,
  } = useInvoiceStore();

  // Download hook
  const { downloadFile, isDownloading, downloadError, clearError } = useDownloadInvoice();
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // Compute filtered and sorted invoices locally
  const allInvoices = useMemo(() => {
    const filtered = applyInvoiceFilters(allInvoicesRaw, activeFilters);
    return sortInvoices(filtered, sortConfig);
  }, [allInvoicesRaw, activeFilters, sortConfig]);

  // Computed values
  const totalCount = getTotalInvoiceCount();
  const hasMore = false; // No pagination needed with preloaded data
  const isFetchingNextPage = false;
  const isError = !!error;
  const loadMore = () => {}; // No-op since we have all data
  const prefetchNext = () => {}; // No-op since we have all data

  // Event handlers
  const handleFilterChange = useCallback((key: keyof ReportingFilters, value: string | string[]) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStatusToggle = useCallback((status: string) => {
    setActiveFilters(prev => {
      const currentStatus = prev.status || [];
      const newStatus = currentStatus.includes(status)
        ? currentStatus.filter((s: string) => s !== status)
        : [...currentStatus, status];
      return { ...prev, status: newStatus.length > 0 ? newStatus : undefined };
    });
  }, []);


  const refreshInvoices = useCallback(async () => {
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }, []);

  const getActiveFiltersText = useCallback(() => {
    const activeFiltersList = [];
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      activeFiltersList.push(`Status: ${activeFilters.status.length} selected`);
    }
    if (activeFilters.vat_scheme && activeFilters.vat_scheme.length > 0) {
      activeFiltersList.push(`VAT Scheme: ${activeFilters.vat_scheme.length} selected`);
    }
    if (activeFilters.currency && activeFilters.currency.length > 0) {
      activeFiltersList.push(`Currency: ${activeFilters.currency.length} selected`);
    }
    
    return activeFiltersList.length > 0 ? ` (filtered by: ${activeFiltersList.join(', ')})` : '';
  }, [activeFilters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (activeFilters.status && activeFilters.status.length > 0) count++;
    if (activeFilters.vat_scheme && activeFilters.vat_scheme.length > 0) count++;
    if (activeFilters.currency && activeFilters.currency.length > 0) count++;
    return count;
  }, [activeFilters]);

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const isFilterOpen = Boolean(filterAnchorEl);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    
    try {
      // Convert ReportingFilters to InvoiceQueryParams format
      const exportParams: Record<string, unknown> = {
        sort_by: sortConfig.field,
        sort_order: sortConfig.order,
      };
      
      // Convert multi-select arrays to single values for the old API
      if (activeFilters.status && activeFilters.status.length > 0) {
        exportParams.status = activeFilters.status;
      }
      if (activeFilters.vat_scheme && activeFilters.vat_scheme.length > 0) {
        exportParams.vat_scheme = activeFilters.vat_scheme[0]; // Take first value
      }
      if (activeFilters.currency && activeFilters.currency.length > 0) {
        exportParams.currency = activeFilters.currency[0]; // Take first value
      }
      
      console.log('Exporting with filters:', exportParams);
      
      const blob = await InvoiceApiService.exportInvoices(exportParams);
      
      // Check if the response is actually a CSV (not an error response)
      if (blob.type === 'application/json') {
        // If we got JSON back, it's probably an error
        const text = await blob.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.detail || 'Export failed');
      }
      
      // Create download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Create filename with current filters info
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const statusFilter = activeFilters.status && activeFilters.status.length > 0 ? `_${activeFilters.status.join('-')}` : '';
      a.download = `invoice-claims${statusFilter}_${timestamp}.csv`;
      
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Export completed successfully');
      setExportSuccess(true);
      
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [sortConfig, activeFilters]);

  const formatCurrency = useCallback((amount: string | null | undefined, currency: string | null | undefined) => {
    if (!amount) return '-';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    
    // Handle non-standard currency codes like "ש״ח"
    const validCurrencyCodes = ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'DKK', 'SEK', 'NOK', 'CHF', 'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'ZAR', 'ILS'];
    const safeCurrency = currency && validCurrencyCodes.includes(currency) ? currency : 'EUR';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: safeCurrency,
      }).format(numAmount);
    } catch (error) {
      // Fallback for invalid currency codes
      return `${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency || 'EUR'}`;
    }
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  }, []);

  // Error state
  if (isError && allInvoices.length === 0) {
    return (
      <Box className={styles.container}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Failed to load data:</strong> {error}
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* Header */}
      <ReportingHeader
        totalCount={totalCount}
        isLoading={isLoading}
        isExporting={isExporting}
        activeFiltersText={getActiveFiltersText()}
        onExportClick={handleExport}
        onUploadClick={() => setIsUploadModalOpen(true)}
      />

      {/* Upload Modal (local to this page) */}
      <UploadProvider>
        <UploadModal 
          open={isUploadModalOpen} 
          onClose={() => setIsUploadModalOpen(false)} 
        />
        <UploadProgressManager />
      </UploadProvider>

      {/* Filter Popup - Preserved existing functionality */}
      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 3, minWidth: 300 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filters
          </Typography>
          
          <Stack spacing={3}>
            {/* Status Filter */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['processing', 'completed', 'failed', 'claimable', 'pending', 'error'].map((status) => (
                  <Chip
                    key={status}
                    label={status}
                    clickable
                    onClick={() => handleStatusToggle(status)}
                    color={activeFilters.status?.includes(status) ? 'primary' : 'default'}
                    variant={activeFilters.status?.includes(status) ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* VAT Scheme Filter */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                VAT Scheme
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={activeFilters.vat_scheme?.[0] || ''}
                onChange={(e) => handleFilterChange('vat_scheme', e.target.value ? [e.target.value] : [])}
                SelectProps={{
                  multiple: false,
                }}
              >
                <MenuItem value="">All</MenuItem>
                {['standard', 'reduced', 'zero', 'exempt', 'reverse_charge', 'margin_scheme', 'import_vat', 'export_vat'].map((scheme) => (
                  <MenuItem key={scheme} value={scheme}>
                    {scheme}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Currency Filter */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                Currency
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={activeFilters.currency?.[0] || ''}
                onChange={(e) => handleFilterChange('currency', e.target.value ? [e.target.value] : [])}
                SelectProps={{
                  multiple: false,
                }}
              >
                <MenuItem value="">All</MenuItem>
                {CURRENCY_OPTIONS.map((currency) => (
                  <MenuItem key={currency} value={currency}>
                    {currency}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Stack>
        </Box>
      </Popover>

      {/* Content Area */}
      <Box className={styles.content}>
        {/* Export Error Alert */}
        {exportError && (
          <Alert 
            severity="error" 
            onClose={() => setExportError(null)}
            sx={{ mb: 2 }}
          >
            <Typography variant="body2">
              <strong>Export Failed:</strong> {exportError}
            </Typography>
          </Alert>
        )}

        {/* Reporting Table */}
        <ReportingTable
          invoices={allInvoices}
          isLoading={isLoading}
          isFetchingNextPage={isFetchingNextPage}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onPrefetchNext={prefetchNext}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onDownloadInvoice={async (invoice) => {
            setDownloadingInvoiceId(invoice._id);
            try {
              await downloadFile(invoice._id, invoice.name);
            } finally {
              setDownloadingInvoiceId(null);
            }
          }}
          isDownloading={isDownloading}
          downloadingInvoiceId={downloadingInvoiceId || undefined}
          sortConfig={sortConfig}
          onSort={(field) => {
            setSortConfig(prev => ({
              field,
              order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
            }));
          }}
        />
      </Box>

      {/* Export Success Snackbar */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={6000}
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setExportSuccess(false)} severity="success" sx={{ width: '100%' }}>
          Export completed successfully!
        </Alert>
      </Snackbar>

      {/* Download Error Snackbar */}
      <Snackbar
        open={!!downloadError}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {downloadError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportingPage; 