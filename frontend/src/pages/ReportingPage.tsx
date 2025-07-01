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
  Paper,
  CircularProgress,
  Alert,
  Tooltip,
  Snackbar,
  Popover,
  Divider,
  Badge,
  Checkbox,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
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
import { useInvoiceStore } from '../lib/invoiceStore';
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Get data from Zustand store (all invoices are already in memory)
  const {
    filteredInvoices,
    isLoading,
    error,
    setFilters: setStoreFilters,
    setSearchTerm,
    setSorting,
    getTotalCount
  } = useInvoiceStore();

  // Apply filters to store when local filters change
  useEffect(() => {
    setStoreFilters({
      status: filters.status.length > 0 ? filters.status : undefined,
      filename: filters.filename || undefined,
      vat_scheme: filters.vat_scheme || undefined,
      currency: filters.currency || undefined,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
    });
    setSearchTerm(filters.search);
    setSorting(sortBy, sortOrder);
  }, [filters, sortBy, sortOrder, setStoreFilters, setSearchTerm, setSorting]);

  // All invoices are already filtered by the store
  const allInvoices = filteredInvoices;
  const totalCount = getTotalCount();

  // Virtual scrolling setup
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: allInvoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // No need for infinite scroll - all data is already in memory

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

  const getActiveFiltersText = useCallback(() => {
    const activeFilters = [];
    
    if (filters.status.length > 0) {
      activeFilters.push(`Status: ${filters.status.length} selected`);
    }
    if (filters.search) {
      activeFilters.push(`Search: "${filters.search}"`);
    }
    if (filters.filename) {
      activeFilters.push(`Filename: "${filters.filename}"`);
    }
    if (filters.vat_scheme) {
      activeFilters.push(`VAT Scheme: ${filters.vat_scheme}`);
    }
    if (filters.currency) {
      activeFilters.push(`Currency: ${filters.currency}`);
    }
    if (filters.date_from || filters.date_to) {
      activeFilters.push('Date range');
    }
    
    return activeFilters.length > 0 ? ` (filtered by: ${activeFilters.join(', ')})` : '';
  }, [filters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.status.length > 0) count++;
    if (filters.search) count++;
    if (filters.filename) count++;
    if (filters.vat_scheme) count++;
    if (filters.currency) count++;
    if (filters.date_from || filters.date_to) count++;
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
      // Build export params with current filters and sorting
      const exportParams = {
        ...filters,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      
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
      const statusFilter = filters.status.length > 0 ? `_${filters.status.join('-')}` : '';
      const searchFilter = filters.search ? `_${filters.search.replace(/[^a-zA-Z0-9]/g, '')}` : '';
      a.download = `invoice-claims${statusFilter}${searchFilter}_${timestamp}.csv`;
      
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
  }, [filters, sortBy, sortOrder]);

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
                : `Export ${totalCount} invoice${totalCount !== 1 ? 's' : ''} ${filters.status.length > 0 ? `(filtered by: ${filters.status.join(', ')})` : ''}`
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
          <IconButton onClick={() => window.location.reload()}>
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

          <Stack spacing={0}>
            {/* Search Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 2, 
              px: 1,
              borderBottom: '1px solid #f0f0f0',
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Search
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  placeholder="Search for a filename..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  fullWidth
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#999', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Status Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              py: 2, 
              px: 1,
              borderBottom: '1px solid #f0f0f0',
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0, pt: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Status
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(STATUS_CONFIG).map(([value, config]) => {
                    const IconComponent = config.icon;
                    const isSelected = filters.status.includes(value);
                    return (
                      <Chip
                        key={value}
                        label={config.label}
                        icon={<IconComponent sx={{ fontSize: '14px !important' }} />}
                        onClick={() => handleStatusToggle(value)}
                        variant={isSelected ? 'filled' : 'outlined'}
                        size="small"
                        sx={{
                          borderColor: config.color,
                          backgroundColor: isSelected ? config.color : 'transparent',
                          color: isSelected ? 'white' : config.color,
                          fontSize: '12px',
                          height: '28px',
                          '& .MuiChip-icon': {
                            color: isSelected ? 'white' : config.color,
                          },
                          '&:hover': {
                            backgroundColor: isSelected ? config.color : config.backgroundColor,
                            color: isSelected ? 'white' : config.color,
                          }
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>

            {/* Filename Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 2, 
              px: 1,
              borderBottom: '1px solid #f0f0f0',
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Filename
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  placeholder="Filter by filename"
                  value={filters.filename}
                  onChange={(e) => handleFilterChange('filename', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                />
              </Box>
            </Box>

            {/* VAT Scheme Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 2, 
              px: 1,
              borderBottom: '1px solid #f0f0f0',
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  VAT Scheme
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  select
                  value={filters.vat_scheme}
                  onChange={(e) => handleFilterChange('vat_scheme', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                >
                  <MenuItem value="">All VAT Schemes</MenuItem>
                  {VAT_SCHEMES.map((scheme) => (
                    <MenuItem key={scheme} value={scheme}>
                      {scheme}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Currency Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 2, 
              px: 1,
              borderBottom: '1px solid #f0f0f0',
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Currency
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <TextField
                  select
                  value={filters.currency}
                  onChange={(e) => handleFilterChange('currency', e.target.value)}
                  fullWidth
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                >
                  <MenuItem value="">All Currencies</MenuItem>
                  {CURRENCY_OPTIONS.map((curr) => (
                    <MenuItem key={curr} value={curr}>
                      {curr}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Date Range Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              py: 2, 
              px: 1,
              '&:hover': {
                backgroundColor: '#fafafa',
              }
            }}>
              <Box sx={{ width: 100, flexShrink: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#333' }}>
                  Date Range
                </Typography>
              </Box>
              <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="From"
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                />
                <TextField
                  placeholder="To"
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '6px',
                      fontSize: '14px',
                      '&:hover': {
                        borderColor: '#d0d0d0',
                      },
                      '&.Mui-focused': {
                        borderColor: '#1976d2',
                        boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                      },
                      '& fieldset': {
                        border: 'none',
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Popover>

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
            Failed to load invoice data: {error}
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
              
              {/* No need for loading indicator - all data is in memory */}
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Success Snackbar */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={4000}
        onClose={() => setExportSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setExportSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          CSV export completed successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportingPage; 