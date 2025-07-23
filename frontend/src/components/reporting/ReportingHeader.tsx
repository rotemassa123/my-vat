import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Badge,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import styles from './ReportingHeader.module.scss';

interface ReportingHeaderProps {
  totalCount: number;
  isLoading: boolean;
  isExporting: boolean;
  activeFiltersCount: number;
  activeFiltersText: string;
  onFilterClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onExportClick: () => void;
  onRefreshClick: () => void;
  isFilterOpen: boolean;
}

const ReportingHeader: React.FC<ReportingHeaderProps> = ({
  totalCount,
  isLoading,
  isExporting,
  activeFiltersCount,
  activeFiltersText,
  onFilterClick,
  onExportClick,
  onRefreshClick,
  isFilterOpen,
}) => {
  return (
    <Box className={styles.header}>
      <Box className={styles.titleSection}>
        <Typography className={styles.pageTitle}>
          Invoice Claims Reporting
        </Typography>
        <Typography className={styles.subtitle}>
          {totalCount > 0 
            ? `${totalCount} claims found${activeFiltersText}` 
            : isLoading 
              ? 'Loading...' 
              : 'No claims found'
          }
        </Typography>
      </Box>
      
      <Box className={styles.actionButtons}>
        {/* Show Filter Button */}
        <Badge 
          badgeContent={activeFiltersCount} 
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
            onClick={onFilterClick}
            className={styles.filterButton}
            sx={{
              backgroundColor: isFilterOpen ? '#d7eeff' : '#d7eeff',
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
              }
            }}
          >
            Show Filter
          </Button>
        </Badge>

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

        {/* Refresh Button */}
        <IconButton 
          onClick={onRefreshClick} 
          disabled={isLoading}
          sx={{
            backgroundColor: '#f5f5f5',
            borderRadius: '10px',
            width: '46px',
            height: '46px',
            '&:hover': {
              backgroundColor: '#e0e0e0',
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ReportingHeader; 