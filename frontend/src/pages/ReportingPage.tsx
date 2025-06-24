import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Button,
  IconButton,
  InputAdornment,
  Card,
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
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
import { useInfiniteInvoices } from '../hooks/useInvoices';
import { InvoiceApiService } from '../lib/invoiceApi';
import type { InvoiceQueryParams, InvoiceStatus } from '../types/api';
import styles from './ReportingPage.module.scss';

const ROW_HEIGHT = 60;

interface FilterState {
  search: string;
  status: string[];
  filename: string;
  vat_scheme: string;
  currency: string;
  date_from: string;
  date_to: string;
}

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
const VAT_SCHEMES = ['Standard', 'Reduced', 'Zero', 'Exempt'];

const ReportingPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    filename: '',
    vat_scheme: '',
    currency: '',
    date_from: '',
    date_to: '',
  });
  
  const [sortBy, setSortBy] = useState<string>('submitted_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Build query params (excluding page since we use infinite scroll)
  const queryParams: Omit<InvoiceQueryParams, 'page'> = useMemo(() => ({
    ...filters,
    sort_by: sortBy,
    sort_order: sortOrder,
  }), [filters, sortBy, sortOrder]);

  // Fetch data with infinite scroll
  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage,
    refetch 
  } = useInfiniteInvoices(queryParams);

  // Flatten all pages into a single array for virtualization
  const allInvoices = useMemo(() => {
    return data?.pages?.flatMap((page: any) => page.items) || [];
  }, [data]);

  // Total count from first page
  const totalCount = data?.pages?.[0]?.total || 0;

  // Virtual scrolling setup
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: allInvoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Load more data when scrolling near the end
  useEffect(() => {
    const [lastItem] = [...virtualizer.getVirtualItems()].reverse();
    
    if (!lastItem) return;
    
    // Load more when we're within 5 items of the end
    if (
      lastItem.index >= allInvoices.length - 5 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allInvoices.length,
    isFetchingNextPage,
    virtualizer.getVirtualItems(),
  ]);

  // Event handlers
  const handleFilterChange = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleStatusToggle = useCallback((status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }));
  }, []);

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      search: '',
      status: [],
      filename: '',
      vat_scheme: '',
      currency: '',
      date_from: '',
      date_to: '',
    });
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const blob = await InvoiceApiService.exportInvoices(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-claims-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [filters]);

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

  return (
    <Box className={styles.container}>
      {/* Header */}
      <Box className={styles.header}>
        <Box>
          <Typography className={styles.title}>
            Invoice Claims Reporting
          </Typography>
          <Typography className={styles.subtitle}>
            {totalCount > 0 ? `${totalCount} claims found` : isLoading ? 'Loading...' : 'No claims found'}
          </Typography>
        </Box>
        
        <Box className={styles.headerActions}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
            className={styles.filterButton}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || allInvoices.length === 0}
          >
            Export CSV
          </Button>
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Filters */}
      {showFilters && (
        <Card className={styles.filtersCard}>
          <Box className={styles.filtersGrid}>
            {/* Search */}
            <TextField
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />

            {/* Status Filter */}
            <Box>
              <Typography variant="body2" className={styles.filterLabel}>
                Status
              </Typography>
              <Box className={styles.statusChips}>
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <Chip
                    key={value}
                    label={config.label}
                    onClick={() => handleStatusToggle(value)}
                    variant={filters.status.includes(value) ? 'filled' : 'outlined'}
                    icon={<config.icon sx={{ fontSize: '16px !important' }} />}
                    sx={{
                      borderColor: config.color,
                      backgroundColor: filters.status.includes(value) ? config.color : 'transparent',
                      color: filters.status.includes(value) ? 'white' : config.color,
                      '& .MuiChip-icon': {
                        color: filters.status.includes(value) ? 'white' : config.color,
                      },
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Other Filters */}
            <TextField
              label="Filename"
              value={filters.filename}
              onChange={(e) => handleFilterChange('filename', e.target.value)}
              size="small"
            />

            <TextField
              label="VAT Scheme"
              select
              value={filters.vat_scheme}
              onChange={(e) => handleFilterChange('vat_scheme', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {VAT_SCHEMES.map((scheme) => (
                <MenuItem key={scheme} value={scheme}>
                  {scheme}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Currency"
              select
              value={filters.currency}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              {CURRENCY_OPTIONS.map((curr) => (
                <MenuItem key={curr} value={curr}>
                  {curr}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Date From"
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <TextField
              label="Date To"
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
            >
              Clear All
            </Button>
          </Box>
        </Card>
      )}

      {/* Table */}
      <Paper className={styles.tableContainer}>
        {/* Table Header */}
        <Box className={styles.tableHeader}>
          <Box className={styles.headerCell} onClick={() => handleSort('file_name')}>
            Filename
            {sortBy === 'file_name' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('status')}>
            Status
            {sortBy === 'status' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('vat_scheme')}>
            VAT Scheme
            {sortBy === 'vat_scheme' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('submitted_date')}>
            Submitted Date
            {sortBy === 'submitted_date' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('currency')}>
            Currency
            {sortBy === 'currency' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('claim_amount')}>
            Claim Amount
            {sortBy === 'claim_amount' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
          <Box className={styles.headerCell} onClick={() => handleSort('refund_amount')}>
            Refund Amount
            {sortBy === 'refund_amount' && (
              <span className={styles.sortIndicator}>
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </Box>
        </Box>

        {/* Table Body */}
        {error && (
          <Alert severity="error" className={styles.errorAlert}>
            Failed to load invoice data: {error.message}
          </Alert>
        )}

        {isLoading && allInvoices.length === 0 && (
          <Box className={styles.loadingContainer}>
            <CircularProgress />
            <Typography>Loading invoice claims...</Typography>
          </Box>
        )}

        {!isLoading && !error && allInvoices.length === 0 && (
          <Box className={styles.loadingContainer}>
            <Typography>No invoice claims found</Typography>
          </Box>
        )}

        {allInvoices.length > 0 && (
          <Box
            ref={parentRef}
            className={styles.virtualContainer}
            style={{ height: '600px', overflow: 'auto' }}
          >
            <Box
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const invoice = allInvoices[virtualRow.index];
                if (!invoice) return null;

                return (
                  <Box
                    key={virtualRow.key}
                    className={styles.tableRow}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <Box className={styles.cell}>
                      {invoice.file_name || '-'}
                    </Box>
                    <Box className={styles.cell}>
                      {renderStatusChip(invoice.status, invoice.reason)}
                    </Box>
                    <Box className={styles.cell}>
                      {invoice.vat_scheme || '-'}
                    </Box>
                    <Box className={styles.cell}>
                      {formatDate(invoice.submitted_date)}
                    </Box>
                    <Box className={styles.cell}>
                      {invoice.currency || '-'}
                    </Box>
                    <Box className={styles.cell}>
                      {formatCurrency(invoice.claim_amount, invoice.currency)}
                    </Box>
                    <Box className={styles.cell}>
                      {formatCurrency(invoice.refund_amount, invoice.currency)}
                    </Box>
                  </Box>
                );
              })}
              
              {/* Loading indicator at the bottom when fetching more */}
              {isFetchingNextPage && (
                <Box
                  style={{
                    position: 'absolute',
                    top: `${virtualizer.getTotalSize()}px`,
                    left: 0,
                    width: '100%',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircularProgress size={24} />
                  <Typography style={{ marginLeft: '8px' }}>Loading more...</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ReportingPage; 