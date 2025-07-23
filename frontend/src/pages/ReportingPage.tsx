import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Button,
  Alert,
  Snackbar,
  Popover,
  Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { useReporting } from '../hooks/useReporting';
import { InvoiceApiService } from '../lib/invoiceApi';
import type { ReportingFilters } from '../types/reporting';
import { ReportingHeader, ReportingTable } from '../components/reporting';
import styles from './ReportingPage.module.scss';

// Status configuration moved to ReportingTableRow component

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];
const VAT_SCHEMES = ['standard', 'reduced', 'zero', 'exempt', 'reverse_charge', 'margin_scheme', 'import_vat', 'export_vat'];

const ReportingPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Use the new reporting hook with infinite query
  const {
    invoices: allInvoices,
    totalCount,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    hasMore,
    loadMore,
    prefetchNext,
    filters,
    updateFilters,
    clearFilters,
    sortConfig,
    refresh: refreshInvoices,
  } = useReporting({
    pageSize: 100,
    enabled: true,
  });

  // Event handlers
  const handleFilterChange = useCallback((key: keyof ReportingFilters, value: string | string[]) => {
    updateFilters({ [key]: value });
  }, [updateFilters]);

  const handleStatusToggle = useCallback((status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status)
      ? currentStatus.filter(s => s !== status)
      : [...currentStatus, status];
    updateFilters({ status: newStatus.length > 0 ? newStatus : undefined });
  }, [filters.status, updateFilters]);



  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const getActiveFiltersText = useCallback(() => {
    const activeFilters = [];
    
    if (filters.status && filters.status.length > 0) {
      activeFilters.push(`Status: ${filters.status.length} selected`);
    }
    if (filters.vat_scheme && filters.vat_scheme.length > 0) {
      activeFilters.push(`VAT Scheme: ${filters.vat_scheme.length} selected`);
    }
    if (filters.currency && filters.currency.length > 0) {
      activeFilters.push(`Currency: ${filters.currency.length} selected`);
    }
    
    return activeFilters.length > 0 ? ` (filtered by: ${activeFilters.join(', ')})` : '';
  }, [filters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.vat_scheme && filters.vat_scheme.length > 0) count++;
    if (filters.currency && filters.currency.length > 0) count++;
    return count;
  }, [filters]);

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
      if (filters.status && filters.status.length > 0) {
        exportParams.status = filters.status;
      }
      if (filters.vat_scheme && filters.vat_scheme.length > 0) {
        exportParams.vat_scheme = filters.vat_scheme[0]; // Take first value
      }
      if (filters.currency && filters.currency.length > 0) {
        exportParams.currency = filters.currency[0]; // Take first value
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
      const statusFilter = filters.status && filters.status.length > 0 ? `_${filters.status.join('-')}` : '';
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
  }, [filters, sortConfig]);

  const formatCurrency = useCallback((amount: string | null | undefined, currency: string | null | undefined) => {
    if (!amount || !currency) return '-';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return '-';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(numAmount);
    } catch (error) {
      // If currency formatting fails, show amount with currency symbol
      console.warn('Currency formatting failed for:', currency, error);
      return `${numAmount.toFixed(2)} ${currency}`;
    }
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  // Status chip rendering moved to ReportingTableRow component

  if (isError) {
    return (
      <Box className={styles.container}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load reporting data: {error?.message}
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
        activeFiltersCount={getActiveFiltersCount()}
        activeFiltersText={getActiveFiltersText()}
        onFilterClick={handleFilterClick}
        onExportClick={handleExport}
        onRefreshClick={() => refreshInvoices()}
        isFilterOpen={isFilterOpen}
      />

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
        PaperProps={{
          sx: {
            width: 480,
            maxHeight: 500,
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            border: '1px solid #e0e0e0',
            borderRadius: 3,
            overflow: 'hidden',
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px', color: '#333' }}>
              Filter by
            </Typography>
            <Button
              variant="text"
              onClick={handleClearFilters}
              sx={{ 
                color: '#666',
                fontSize: '13px',
                textTransform: 'none',
                minWidth: 'auto',
                padding: '4px 8px',
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: '#1976d2',
                }
              }}
            >
              Clear all
            </Button>
          </Box>

          <Stack spacing={2}>
            {/* Status Filter */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#333', mb: 1 }}>
                Status
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {['processing', 'failed', 'not_claimable', 'claimable', 'awaiting_claim_result', 'claim_accepted', 'claim_rejected'].map((status) => (
                  <Chip
                    key={status}
                    label={status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    onClick={() => handleStatusToggle(status)}
                    variant={filters.status?.includes(status) ? 'filled' : 'outlined'}
                    color={filters.status?.includes(status) ? 'primary' : 'default'}
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
                value={filters.vat_scheme?.[0] || ''}
                onChange={(e) => handleFilterChange('vat_scheme', e.target.value ? [e.target.value] : [])}
                SelectProps={{
                  multiple: false,
                }}
              >
                <MenuItem value="">All</MenuItem>
                {VAT_SCHEMES.map((scheme) => (
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
                value={filters.currency?.[0] || ''}
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
      />

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
    </Box>
  );
};

export default ReportingPage; 