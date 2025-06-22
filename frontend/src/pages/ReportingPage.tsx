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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { useInfiniteInvoices } from '../hooks/useInvoices';
import { InvoiceApiService } from '../lib/invoiceApi';
import type { InvoiceQueryParams, Invoice } from '../types/api';
import styles from './ReportingPage.module.scss';

const ROW_HEIGHT = 60;

interface FilterState {
  search: string;
  status: string[];
  claimant: string;
  vat_scheme: string;
  currency: string;
  date_from: string;
  date_to: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#ff9800' },
  { value: 'processing', label: 'Processing', color: '#2196f3' },
  { value: 'completed', label: 'Completed', color: '#4caf50' },
  { value: 'failed', label: 'Failed', color: '#f44336' },
  { value: 'submitted', label: 'Submitted', color: '#9c27b0' },
  { value: 'approved', label: 'Approved', color: '#4caf50' },
  { value: 'rejected', label: 'Rejected', color: '#f44336' },
];

const CURRENCY_OPTIONS = ['EUR', 'USD', 'GBP', 'CAD', 'AUD'];
const VAT_SCHEMES = ['Standard', 'Reduced', 'Zero', 'Exempt'];

const ReportingPage: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    claimant: '',
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
      claimant: '',
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

  const formatCurrency = useCallback((amount: number | undefined, currency: string | undefined) => {
    if (!amount || !currency) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'MMM dd, yyyy');
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.color || '#666';
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
                {STATUS_OPTIONS.map((status) => (
                  <Chip
                    key={status.value}
                    label={status.label}
                    onClick={() => handleStatusToggle(status.value)}
                    variant={filters.status.includes(status.value) ? 'filled' : 'outlined'}
                    style={{
                      borderColor: status.color,
                      backgroundColor: filters.status.includes(status.value) ? status.color : 'transparent',
                      color: filters.status.includes(status.value) ? 'white' : status.color,
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            {/* Other Filters */}
            <TextField
              label="Claimant"
              value={filters.claimant}
              onChange={(e) => handleFilterChange('claimant', e.target.value)}
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
          <Box className={styles.headerCell} onClick={() => handleSort('claimant')}>
            Claimant
            {sortBy === 'claimant' && (
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
          <Box className={styles.headerCell} onClick={() => handleSort('status')}>
            Status
            {sortBy === 'status' && (
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
                      {invoice.claimant || invoice.supplier_name || '-'}
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
                      <Chip
                        label={invoice.status}
                        size="small"
                        style={{
                          backgroundColor: getStatusColor(invoice.status),
                          color: 'white',
                        }}
                      />
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