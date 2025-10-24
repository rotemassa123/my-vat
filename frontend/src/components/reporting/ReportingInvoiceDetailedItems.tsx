import React from 'react';
import { Box, Typography } from '@mui/material';
import type { ReportingInvoice } from '../../types/reporting';
import styles from './ReportingInvoiceDetailedItems.module.scss';

interface ReportingInvoiceDetailedItemsProps {
  invoice: ReportingInvoice;
}

const ReportingInvoiceDetailedItems: React.FC<ReportingInvoiceDetailedItemsProps> = ({ invoice }) => {
  // Extract detailed items from summary_content
  const detailedItems = invoice.summary_content?.detailed_items || [];
  
  if (!detailedItems || detailedItems.length === 0) {
    return (
      <Box className={styles.container}>
        <Typography variant="body2" className={styles.noItems}>
          No detailed items available for this invoice.
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* Subtle header row */}
      <Box className={styles.headerRow}>
        <Box className={styles.headerCell}>Description</Box>
        <Box className={styles.headerCell}>Amount</Box>
        <Box className={styles.headerCell}>Currency</Box>
        <Box className={styles.headerCell}>VAT Rate</Box>
      </Box>
      
      {/* Data rows */}
      {detailedItems.map((item, index) => (
        <Box key={index} className={styles.dataRow}>
          <Box className={styles.dataCell}>
            {item.description || '-'}
          </Box>
          <Box className={styles.dataCell}>
            {item.amount ? 
              (typeof item.amount === 'number' 
                ? item.amount.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })
                : item.amount
              ) 
              : '-'
            }
          </Box>
          <Box className={styles.dataCell}>
            {invoice.currency || '-'}
          </Box>
          <Box className={styles.dataCell}>
            {item.vat_rate !== undefined ? `${item.vat_rate}%` : '-'}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ReportingInvoiceDetailedItems;
