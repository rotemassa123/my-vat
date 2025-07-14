import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Button,
  IconButton,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
  Popover,
  Badge,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  HourglassTop as ProcessingIcon,
  Error as ErrorIcon,
  Cancel as NotClaimableIcon,
  CheckCircle as ClaimableIcon,
  Schedule as AwaitingIcon,
  ThumbUp as AcceptedIcon,
  ThumbDown as RejectedIcon,
} from '@mui/icons-material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { useReporting } from '../hooks/useReporting';
import { InvoiceApiService } from '../lib/invoiceApi';
import type { InvoiceStatus } from '../types/api';
import type { ReportingFilters } from '../types/reporting';
import styles from './ReportingPage.module.scss';

const ROW_HEIGHT = 60;

// Status configuration with beautiful styling
const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    color: '#2196f3',
    backgroundColor: '#e3f2fd',
    icon: ProcessingIcon,
    description: 'File is being processed (discovery, upload, analysis)',
  },
  failed: {
    label: 'Failed',
    color: '#f44336',
    backgroundColor: '#ffebee',
    icon: ErrorIcon,
    description: 'Processing failed - check reason for details',
  },
  not_claimable: {
    label: 'Not Claimable',
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    icon: NotClaimableIcon,
    description: 'Document determined to be not claimable',
  },
  claimable: {
    label: 'Ready to Claim',
    color: '#4caf50',
    backgroundColor: '#e8f5e8',
    icon: ClaimableIcon,
    description: 'Document is claimable and ready for submission',
  },
  awaiting_claim_result: {
    label: 'Awaiting Result',
    color: '#9c27b0',
    backgroundColor: '#f3e5f5',
    icon: AwaitingIcon,
    description: 'Claim submitted, waiting for result',
  },
  claim_accepted: {
    label: 'Claim Accepted',
    color: '#4caf50',
    backgroundColor: '#e8f5e8',
    icon: AcceptedIcon,
    description: 'Claim was accepted and approved',
  },
  claim_rejected: {
    label: 'Claim Rejected',
    color: '#f44336',
    backgroundColor: '#ffebee',
    icon: RejectedIcon,
    description: 'Claim was rejected',
  },
};

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

  // Virtual scrolling setup
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: hasMore ? allInvoices.length + 1 : allInvoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  // Auto-load more when near bottom
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= allInvoices.length - 10 && // Load more when 10 items from end
      hasMore &&
      !isFetchingNextPage
    ) {
      loadMore();
    }
  }, [hasMore, loadMore, isFetchingNextPage, virtualizer, allInvoices.length]);

  // Prefetch next page when scrolling
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= allInvoices.length - 50 && // Prefetch when 50 items from end
      hasMore &&
      !isFetchingNextPage
    ) {
      prefetchNext();
    }
  }, [prefetchNext, hasMore, isFetchingNextPage, virtualizer, allInvoices.length]);

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

  const renderStatusChip = useCallback((status: InvoiceStatus, reason?: string) => {
    const config = STATUS_CONFIG[status];
    if (!config) {
      // Fallback: show the raw status as a basic chip
      return (
        <Chip
          label={status || 'Unknown'}
          size="small"
          sx={{
            backgroundColor: '#f5f5f5',
            color: '#666',
            border: '1px solid #ccc',
          }}
        />
      );
    }

    const IconComponent = config.icon;
    
    const chip = (
      <Chip
        icon={<IconComponent sx={{ fontSize: '16px !important' }} />}
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.backgroundColor,
          color: config.color,
          border: `1px solid ${config.color}`,
          fontWeight: 600,
          '& .MuiChip-icon': {
            color: config.color,
          },
        }}
      />
    );

    // Add tooltip with description and reason if available
    const tooltipTitle = (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {config.label}
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
          {config.description}
        </Typography>
        {reason && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
            Reason: {reason}
          </Typography>
        )}
      </Box>
    );

    return (
      <Tooltip title={tooltipTitle} arrow placement="top">
        {chip}
      </Tooltip>
    );
  }, []);

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
      <Box className={styles.header}>
        <Box>
          <Typography className={styles.title}>
            Invoice Claims Reporting
          </Typography>
          <Typography className={styles.subtitle}>
            {totalCount > 0 
              ? `${totalCount} claims found${getActiveFiltersText()}` 
              : isLoading 
                ? 'Loading...' 
                : 'No claims found'
            }
          </Typography>
        </Box>
        
        <Box className={styles.headerActions}>
          <Badge 
            badgeContent={getActiveFiltersCount()} 
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#1976d2',
                color: 'white',
                fontWeight: 600,
                fontSize: '11px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
              }
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              className={styles.filterButton}
              sx={{
                backgroundColor: isFilterOpen ? '#f0f8ff' : 'transparent',
                borderColor: getActiveFiltersCount() > 0 ? '#1976d2' : '#e0e0e0',
                color: getActiveFiltersCount() > 0 ? '#1976d2' : '#666',
                fontWeight: getActiveFiltersCount() > 0 ? 600 : 400,
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#f0f8ff',
                  borderColor: '#1976d2',
                  color: '#1976d2',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }
              }}
            >
              Filter
            </Button>
          </Badge>
          <Tooltip 
            title={
              allInvoices.length === 0 
                ? "No invoices to export" 
                : `Export ${totalCount} invoice${totalCount !== 1 ? 's' : ''} ${filters.status && filters.status.length > 0 ? `(filtered by: ${filters.status.join(', ')})` : ''}`
            }
            arrow
          >
            <span>
              <Button
                variant="outlined"
                startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={isLoading || allInvoices.length === 0 || isExporting}
                sx={{
                  minWidth: '120px', // Prevent button width changes during loading
                }}
              >
                {isExporting ? 'Exporting...' : `Export CSV (${totalCount})`}
              </Button>
            </span>
          </Tooltip>
          <IconButton onClick={() => refreshInvoices()} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

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

      {/* Filter Popup */}
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
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <Chip
                    key={status}
                    label={config.label}
                    onClick={() => handleStatusToggle(status)}
                    variant={filters.status?.includes(status) ? 'filled' : 'outlined'}
                    color={filters.status?.includes(status) ? 'primary' : 'default'}
                    size="small"
                    sx={{
                      borderColor: config.color,
                      color: filters.status?.includes(status) ? 'white' : config.color,
                      backgroundColor: filters.status?.includes(status) ? config.color : 'transparent',
                      '&:hover': {
                        backgroundColor: config.color,
                        color: 'white',
                      }
                    }}
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

      {/* Virtual Scrolling Table */}
      <Paper sx={{ mt: 2 }}>
        <Box
          ref={parentRef}
          sx={{
            height: 600,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {isLoading && allInvoices.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const isLoaderRow = virtualItem.index > allInvoices.length - 1;
                const invoice = allInvoices[virtualItem.index];

                return (
                  <Box
                    key={virtualItem.index}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      borderBottom: '1px solid #f0f0f0',
                      '&:hover': {
                        backgroundColor: '#f9f9f9',
                      }
                    }}
                  >
                    {isLoaderRow ? (
                      hasMore ? (
                        <Box display="flex" justifyContent="center" alignItems="center" width="100%">
                          <CircularProgress size={24} />
                          <Typography variant="body2" ml={1}>
                            Loading more invoices...
                          </Typography>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" width="100%">
                          <Typography variant="body2" color="text.secondary">
                            No more invoices to load
                          </Typography>
                        </Box>
                      )
                    ) : (
                      <>
                        <Box sx={{ width: 200, flexShrink: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {invoice.name || 'Unnamed Invoice'}
                          </Typography>
                        </Box>
                        <Box sx={{ width: 150, flexShrink: 0 }}>
                          <Typography variant="body2">
                            {invoice.supplier || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ width: 120, flexShrink: 0 }}>
                          {renderStatusChip(invoice.status as InvoiceStatus)}
                        </Box>
                        <Box sx={{ width: 100, flexShrink: 0 }}>
                          <Typography variant="body2">
                            {formatCurrency(invoice.net_amount, invoice.currency)}
                          </Typography>
                        </Box>
                        <Box sx={{ width: 100, flexShrink: 0 }}>
                          <Typography variant="body2">
                            {invoice.currency || '-'}
                          </Typography>
                        </Box>
                        <Box sx={{ width: 120, flexShrink: 0 }}>
                          <Typography variant="body2">
                            {formatDate(invoice.created_at)}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Loading indicator at bottom */}
        {isFetchingNextPage && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" ml={1}>
              Loading more invoices...
            </Typography>
          </Box>
        )}
      </Paper>

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