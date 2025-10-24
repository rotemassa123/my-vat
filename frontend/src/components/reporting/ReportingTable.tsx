import React, { useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
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
        <Box className={styles.headerCell} style={{ width: '18%' }}>Claim ID</Box>
        <Box className={styles.headerCell} style={{ width: '14%' }}>Country</Box>
        <Box className={styles.headerCell} style={{ width: '18%' }}>Entity</Box>
        <Box className={styles.headerCell} style={{ width: '14%' }}>Submitted On</Box>
        <Box className={styles.headerCell} style={{ width: '12%' }}>Currency</Box>
        <Box className={styles.headerCell} style={{ width: '14%' }}>VAT Amount</Box>
        <Box className={styles.headerCell} style={{ width: '10%' }}>Status</Box>
      </Box>

      {/* Table Body - Non-virtualized for proper expansion */}
      <Box className={styles.tableBody} onScroll={handleScroll}>
        {invoices.map((invoice, index) => (
          <ReportingTableRow
            key={invoice._id}
            invoice={invoice}
            formatDate={formatDate}
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