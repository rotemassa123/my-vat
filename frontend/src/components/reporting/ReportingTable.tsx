import React, { useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ArrowUpward, ArrowDownward, UnfoldMore } from '@mui/icons-material';
import ReportingTableRow from './ReportingTableRow';
import type { ReportingInvoice } from '../../types/reporting';
import styles from './ReportingTable.module.scss';

interface ReportingTableProps {
  invoices: ReportingInvoice[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onPrefetchNext: () => void;
  formatCurrency: (amount: string | null | undefined, currency: string | null | undefined) => string;
  formatDate: (dateString: string | undefined) => string;
  onDownloadInvoice?: (invoice: ReportingInvoice) => void;
  isDownloading?: boolean;
  downloadingInvoiceId?: string;
  // Sorting props
  sortConfig?: {
    field: string;
    order: 'asc' | 'desc';
  };
  onSort?: (field: string) => void;
}

const ReportingTable: React.FC<ReportingTableProps> = ({
  invoices,
  isLoading,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
  onPrefetchNext,
  formatCurrency,
  formatDate,
  onDownloadInvoice,
  isDownloading = false,
  downloadingInvoiceId,
  sortConfig,
  onSort,
}) => {
  // Auto-load more when scrolling near bottom
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Load more when near bottom
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isFetchingNextPage]);

  // Helper function to render sortable header
  const renderSortableHeader = (field: string, label: string, width: string) => {
    const isActive = sortConfig?.field === field;
    const isAsc = isActive && sortConfig?.order === 'asc';
    const isDesc = isActive && sortConfig?.order === 'desc';

    return (
      <Box 
        className={styles.headerCell} 
        style={{ width, cursor: onSort ? 'pointer' : 'default' }}
        onClick={() => onSort?.(field)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          '&:hover': onSort ? { backgroundColor: '#f5f5f5' } : {},
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {onSort && (
          <Box sx={{ display: 'flex', flexDirection: 'column', ml: 0.5 }}>
            {isAsc ? (
              <ArrowUpward sx={{ fontSize: 16, color: '#1976d2' }} />
            ) : isDesc ? (
              <ArrowDownward sx={{ fontSize: 16, color: '#1976d2' }} />
            ) : (
              <UnfoldMore sx={{ fontSize: 16, color: '#999' }} />
            )}
          </Box>
        )}
      </Box>
    );
  };

  if (isLoading && invoices.length === 0) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading claims...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.tableContainer}>
      {/* Table Header */}
      <Box className={styles.tableHeader}>
        <Box className={styles.headerSpacer} style={{ width: '48px' }}></Box>
        {renderSortableHeader('name', 'Invoice ID', '18%')}
        {renderSortableHeader('country', 'Country', '14%')}
        {renderSortableHeader('entity_name', 'Entity', '18%')}
        {renderSortableHeader('submitted_on', 'Submitted On', '14%')}
        {renderSortableHeader('currency', 'Currency', '12%')}
        {renderSortableHeader('vat_amount_numeric', 'VAT Amount', '14%')}
        {renderSortableHeader('status', 'Status', '10%')}
      </Box>

      {/* Table Body - Non-virtualized for proper expansion */}
      <Box className={styles.tableBody} onScroll={handleScroll}>
        {invoices.map((invoice) => (
          <ReportingTableRow
            key={invoice._id}
            invoice={invoice}
            formatDate={formatDate}
            onDownloadInvoice={onDownloadInvoice}
            isDownloading={isDownloading && downloadingInvoiceId === invoice._id}
          />
        ))}
        
        {/* Loading indicator */}
        {isFetchingNextPage && (
          <Box className={styles.loaderRow}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              Loading more claims...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Loading indicator at bottom */}
      {isFetchingNextPage && (
        <Box className={styles.bottomLoader}>
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 1 }}>
            Loading more claims...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReportingTable; 