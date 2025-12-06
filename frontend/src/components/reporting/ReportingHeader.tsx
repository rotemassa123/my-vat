import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import styles from './ReportingHeader.module.scss';

interface ReportingHeaderProps {
  totalCount: number;
  isLoading: boolean;
  isExporting: boolean;
  activeFiltersText: string;
  onExportClick: () => void;
  onUploadClick: () => void;
}

const ReportingHeader: React.FC<ReportingHeaderProps> = ({
  totalCount,
  isLoading,
  isExporting,
  activeFiltersText,
  onExportClick,
  onUploadClick,
}) => {
  return (
    <Box className={styles.header}>
      <Box className={styles.titleSection}>
        <Typography className={styles.pageTitle}>
          Invoices
        </Typography>
        <Typography className={styles.subtitle}>
          {totalCount > 0 
            ? `${totalCount} invoices found${activeFiltersText}` 
            : isLoading 
              ? 'Loading...' 
              : 'No invoices found'
          }
        </Typography>
      </Box>
      
      <Box className={styles.actionButtons}>
        {/* Upload Invoices Button */}
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={onUploadClick}
          disabled={isLoading}
          className={styles.uploadButton}
          sx={{
            backgroundColor: '#d7eeff',
            borderColor: '#d7eeff',
            color: '#000000',
            fontWeight: 400,
            borderRadius: '10px',
            height: '46px',
            minWidth: '184px',
            textTransform: 'none',
            fontSize: '14px',
            border: 'none',
            boxShadow: 'none',
            marginRight: '12px',
            '&:hover': {
              backgroundColor: '#c5e4ff',
              borderColor: '#c5e4ff',
              boxShadow: 'none',
            },
            '&:disabled': {
              backgroundColor: '#f5f5f5',
              color: '#999',
            }
          }}
        >
          Upload Invoices
        </Button>

        {/* Export Report Button */}
        <Tooltip 
          title={
            totalCount === 0 
              ? "No invoices to export" 
              : `Export ${totalCount} invoice${totalCount !== 1 ? 's' : ''} ${activeFiltersText}`
          }
          arrow
        >
          <span>
            <Button
              variant="outlined"
              startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={onExportClick}
              disabled={isLoading || totalCount === 0 || isExporting}
              className={styles.exportButton}
              sx={{
                backgroundColor: '#d7eeff',
                borderColor: '#d7eeff',
                color: '#000000',
                fontWeight: 400,
                borderRadius: '10px',
                height: '46px',
                minWidth: '184px',
                textTransform: 'none',
                fontSize: '14px',
                border: 'none',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#c5e4ff',
                  borderColor: '#c5e4ff',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                }
              }}
            >
              {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
          </span>
        </Tooltip>

      </Box>
    </Box>
  );
};

export default ReportingHeader; 