import React, { useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useVirtualizer } from '@tanstack/react-virtual';
import ReportingTableRow from './ReportingTableRow';
import type { ReportingInvoice } from '../../types/reporting';
import styles from './ReportingTable.module.scss';

const ROW_HEIGHT = 65;

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
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: hasMore ? invoices.length + 1 : invoices.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  // Auto-load more when near bottom
  React.useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= invoices.length - 10 && // Load more when 10 items from end
      hasMore &&
      !isFetchingNextPage
    ) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore, isFetchingNextPage, virtualizer, invoices.length]);

  // Prefetch next page when scrolling
  React.useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const [lastItem] = [...virtualItems].reverse();

    if (!lastItem) return;

    if (
      lastItem.index >= invoices.length - 50 && // Prefetch when 50 items from end
      hasMore &&
      !isFetchingNextPage
    ) {
      onPrefetchNext();
    }
  }, [onPrefetchNext, hasMore, isFetchingNextPage, virtualizer, invoices.length]);

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
        <Box className={styles.headerCell} style={{ width: '15%' }}>Claim ID</Box>
        <Box className={styles.headerCell} style={{ width: '12%' }}>Country</Box>
        <Box className={styles.headerCell} style={{ width: '15%' }}>Entity</Box>
        <Box className={styles.headerCell} style={{ width: '12%' }}>Submitted On</Box>
        <Box className={styles.headerCell} style={{ width: '10%' }}>Currency</Box>
        <Box className={styles.headerCell} style={{ width: '12%' }}>Amount</Box>
        <Box className={styles.headerCell} style={{ width: '14%' }}>Status</Box>
        <Box className={styles.headerCell} style={{ width: '10%' }}>Actions</Box>
      </Box>

      {/* Virtual Scrolling Table Body */}
      <Box
        ref={parentRef}
        className={styles.tableBody}
      >
        <Box
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const isLoaderRow = virtualItem.index > invoices.length - 1;
            const invoice = invoices[virtualItem.index];

            return (
              <Box
                key={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  <Box className={styles.loaderRow}>
                    {hasMore ? (
                      <>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Loading more claims...
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No more claims to load
                      </Typography>
                    )}
                  </Box>
                ) : invoice ? (
                  <ReportingTableRow
                    invoice={invoice}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                  />
                ) : (
                  <Box className={styles.loaderRow}>
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
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