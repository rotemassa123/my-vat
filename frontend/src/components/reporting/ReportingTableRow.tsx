import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton, 
  Tooltip,
  Button,
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
  ThumbDown as RejectedIcon,
} from '@mui/icons-material';
import type { ReportingInvoice } from '../../types/reporting';
import styles from './ReportingTableRow.module.scss';

// Status configuration matching Figma design
const STATUS_CONFIG = {
  processing: {
    label: 'Processing',
    color: '#2196f3',
    backgroundColor: '#e3f2fd',
    icon: ProcessingIcon,
    description: 'File is being processed',
  },
  failed: {
    label: 'Failed',
    color: '#f44336',
    backgroundColor: '#ffebee',
    icon: ErrorIcon,
    description: 'Processing failed',
  },
  not_claimable: {
    label: 'Not Claimable',
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    icon: NotClaimableIcon,
    description: 'Document not claimable',
  },
  claimable: {
    label: 'Ready to Claim',
    color: '#4caf50',
    backgroundColor: '#e8f5e8',
    icon: ClaimableIcon,
    description: 'Ready for submission',
  },
  awaiting_claim_result: {
    label: 'Pending with Tax Office',
    color: '#f97316',
    backgroundColor: '#fff7ed',
    icon: AwaitingIcon,
    description: 'Awaiting result from tax office',
  },
  claim_accepted: {
    label: 'Approved',
    color: '#189948',
    backgroundColor: '#f0fdf4',
    icon: AcceptedIcon,
    description: 'Claim accepted',
  },
  claim_rejected: {
    label: 'Rejected',
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    icon: RejectedIcon,
    description: 'Claim rejected',
  },
};

interface ReportingTableRowProps {
  invoice: ReportingInvoice;
  formatCurrency: (amount: string | null | undefined, currency: string | null | undefined) => string;
  formatDate: (dateString: string | undefined) => string;
}

const ReportingTableRow: React.FC<ReportingTableRowProps> = ({
  invoice,
  formatCurrency,
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
        <Tooltip title={`${config.description}. Reason: ${reason}`} arrow>
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

        {/* Amount */}
        <Box className={styles.cell} style={{ width: '14%' }}>
          <Typography variant="body2" className={styles.cellText}>
            {formatCurrency(invoice.claim_amount?.toString(), invoice.currency)}
          </Typography>
        </Box>

        {/* Status */}
        <Box className={styles.cell} style={{ width: '10%' }}>
          {renderStatusChip(invoice.status)}
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