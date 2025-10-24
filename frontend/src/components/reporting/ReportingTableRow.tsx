import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton, 
  Tooltip,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  HourglassTop as ProcessingIcon,
  Error as ErrorIcon,
  Cancel as NotClaimableIcon,
  CheckCircle as ClaimableIcon,
  Schedule as AwaitingIcon,
  ThumbUp as AcceptedIcon,
} from '@mui/icons-material';
import type { ReportingInvoice } from '../../types/reporting';
import styles from './ReportingTableRow.module.scss';

// Status configuration with beautiful, unique color palette
const STATUS_CONFIG = {
  failed: {
    label: 'Failed',
    color: '#dc2626', // Deep red
    backgroundColor: '#fef2f2', // Light red background
    icon: ErrorIcon,
    description: '', // Will be overridden with actual reason
  },
  processing: {
    label: 'Processing',
    color: '#2563eb', // Vibrant blue
    backgroundColor: '#eff6ff', // Light blue background
    icon: ProcessingIcon,
    description: 'File is being processed',
  },
  claimable: {
    label: 'Claimable',
    color: '#059669', // Emerald green
    backgroundColor: '#ecfdf5', // Light green background
    icon: ClaimableIcon,
    description: 'Awaiting submission',
  },
  unclaimable: {
    label: 'Unclaimable',
    color: '#d97706', // Amber orange
    backgroundColor: '#fffbeb', // Light amber background
    icon: NotClaimableIcon,
    description: 'Document not claimable',
  },
  submitted: {
    label: 'Submitted',
    color: '#7c3aed', // Purple
    backgroundColor: '#faf5ff', // Light purple background
    icon: AwaitingIcon,
    description: 'Claim submitted to tax office',
  },
  refunded: {
    label: 'Refunded',
    color: '#16a34a', // Forest green
    backgroundColor: '#f0fdf4', // Light green background
    icon: AcceptedIcon,
    description: 'Refund processed',
  },
};

interface ReportingTableRowProps {
  invoice: ReportingInvoice;
  formatDate: (dateString: string | undefined) => string;
}

const ReportingTableRow: React.FC<ReportingTableRowProps> = ({
  invoice,
  formatDate,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Debug logging for entity information
  React.useEffect(() => {
    console.log('Invoice data:', {
      id: invoice._id,
      entity_id: invoice.entity_id,
      entity_name: invoice.entity_name,
      supplier: invoice.supplier,
      vendor_name: invoice.vendor_name
    });
  }, [invoice]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  // Determine status based on business logic
  const determineStatus = (invoice: ReportingInvoice) => {
    // 1. Failed - anyone with a failure
    if (invoice.status === 'failed' || invoice.error_message) {
      return {
        status: 'failed',
        reason: invoice.error_message || 'Processing failed'
      };
    }

    // 2. Claimable/Unclaimable - based on is_claimable flag (check this BEFORE processing)
    if (invoice.is_claimable === true) {
      return {
        status: 'claimable',
        reason: null
      };
    } else if (invoice.is_claimable === false) {
      return {
        status: 'unclaimable',
        reason: null
      };
    }

    // 3. Processing - anyone without a failure and without is_claimable flag
    if (!invoice.error_message && invoice.is_claimable === undefined) {
      return {
        status: 'processing',
        reason: null
      };
    }

    // 4. Submitted and Refunded - for future implementation
    if (invoice.status === 'submitted') {
      return {
        status: 'submitted',
        reason: null
      };
    }

    if (invoice.status === 'refunded') {
      return {
        status: 'refunded',
        reason: null
      };
    }

    // Default fallback
    return {
      status: 'processing',
      reason: null
    };
  };

  const renderStatusChip = (status: string, reason?: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) {
      return (
        <Box className={styles.statusChip} sx={{ backgroundColor: '#f5f5f5' }}>
          <Typography variant="body2" sx={{ color: '#666', fontSize: '14px' }}>
            {status || 'Unknown'}
          </Typography>
        </Box>
      );
    }

    const IconComponent = config.icon;
    
    const chip = (
      <Box className={styles.statusChip} sx={{ backgroundColor: config.backgroundColor }}>
        <IconComponent 
          sx={{ 
            fontSize: 16, 
            color: config.color,
            mr: 0.5 
          }} 
        />
        <Typography 
          variant="body2" 
          sx={{ 
            color: config.color, 
            fontWeight: 500,
            fontSize: '14px'
          }}
        >
          {config.label}
        </Typography>
      </Box>
    );

    if (reason) {
      return (
        <Tooltip title={reason} arrow>
          {chip}
        </Tooltip>
      );
    }

    return (
      <Tooltip title={config.description} arrow>
        {chip}
      </Tooltip>
    );
  };

  // Generate claim ID from invoice name or id
  const getClaimId = () => {
    if (invoice.name && invoice.name.includes('VAT')) {
      return invoice.name;
    }
    const invoiceId = invoice._id;
    if (invoiceId) {
      return `VAT${invoiceId.toString().slice(-5).toUpperCase()}`;
    }
    return 'VAT00000'; // Fallback if no ID is available
  };

  return (
    <Box className={styles.tableRow}>
      <Box className={styles.rowContent}>
        {/* Expand/Collapse Button */}
        <Box className={styles.expandButton}>
          <IconButton
            size="small"
            onClick={handleExpandClick}
            sx={{ 
              width: 20, 
              height: 20,
              color: '#7f7f7f'
            }}
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Box>

        {/* Claim ID */}
        <Box className={styles.cell} style={{ width: '18%' }}>
          <Typography className={styles.claimId}>
            <span className={styles.hashSymbol}>#</span>
            {getClaimId()}
          </Typography>
        </Box>

        {/* Country */}
        <Box className={styles.cell} style={{ width: '14%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {invoice.country || invoice.supplier || '-'}
          </Typography>
        </Box>

        {/* Entity */}
        <Box className={styles.cell} style={{ width: '18%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {invoice.entity_name || invoice.supplier || '-'}
          </Typography>
        </Box>

        {/* Submitted On */}
        <Box className={styles.cell} style={{ width: '14%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {formatDate(invoice.created_at)}
          </Typography>
        </Box>

        {/* Currency */}
        <Box className={styles.cell} style={{ width: '12%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {invoice.currency || '€'}
          </Typography>
        </Box>

        {/* VAT Amount */}
        <Box className={styles.cell} style={{ width: '14%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {(() => {
              // Handle null, undefined, empty string, or invalid values
              if (!invoice.vat_amount || invoice.vat_amount === '' || invoice.vat_amount === null) {
                return '-';
              }
              
              const parsedAmount = parseFloat(String(invoice.vat_amount));
              if (isNaN(parsedAmount) || parsedAmount === 0) {
                return '-';
              }
              
              return parsedAmount.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              });
            })()}
          </Typography>
        </Box>

        {/* Status */}
        <Box className={styles.cell} style={{ width: '10%' }}>
          {(() => {
            const statusInfo = determineStatus(invoice);
            return renderStatusChip(statusInfo.status, statusInfo.reason || undefined);
          })()}
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box className={styles.expandedContent}>
          <Typography variant="body2" color="text.secondary">
            Additional details for {getClaimId()} would appear here...
          </Typography>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ReportingTableRow; 