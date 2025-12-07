import React, { useState } from 'react';
import { Button } from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { useAnalysisFiltersStore } from '../../store/analysisFiltersStore';
import { FilterPopover } from './FilterPopover';
import styles from './FilterButton.module.scss';

export const FilterButton: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const getActiveFilterCount = useAnalysisFiltersStore((state) => state.getActiveFilterCount);
  
  const filterCount = getActiveFilterCount();
  const isOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant={filterCount > 0 ? 'contained' : 'outlined'}
        startIcon={<FilterList />}
        onClick={handleClick}
        className={`${styles.filterButton} ${filterCount > 0 ? styles.active : ''}`}
      >
        {filterCount > 0 ? `Filter / ${filterCount}` : 'Filter'}
      </Button>
      <FilterPopover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
      />
    </>
  );
};

