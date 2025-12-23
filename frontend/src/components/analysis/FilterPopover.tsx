import React from 'react';
import {
  Popover,
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { useAnalysisFiltersStore } from '../../store/analysisFiltersStore';
import { useAccountStore } from '../../store/accountStore';
import { useCountryOptions } from '../../hooks/analysis/useCountryOptions';
import styles from './FilterPopover.module.scss';

interface FilterPopoverProps {
  open: boolean;
  anchorEl: HTMLButtonElement | null;
  onClose: () => void;
}

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', months: 3 },
  { label: 'Last 6 months', months: 6 },
  { label: 'Last year', months: 12 },
] as const;

export const FilterPopover: React.FC<FilterPopoverProps> = ({ open, anchorEl, onClose }) => {
  const { filters, setEntityIds, setCountry, setDateRange, clearFilters } = useAnalysisFiltersStore();
  const { entities } = useAccountStore();
  const { countries, isLoading: countriesLoading } = useCountryOptions();

  const handleEntityToggle = (entityId: string) => {
    const currentIds = filters.entityIds || [];
    const isSelected = currentIds.includes(entityId);
    
    if (isSelected) {
      const newIds = currentIds.filter(id => id !== entityId);
      setEntityIds(newIds.length > 0 ? newIds : undefined);
    } else {
      setEntityIds([...currentIds, entityId]);
    }
  };

  const handleCountryToggle = (country: string) => {
    const currentCountries = filters.country || [];
    const isSelected = currentCountries.includes(country);
    
    if (isSelected) {
      const newCountries = currentCountries.filter(c => c !== country);
      setCountry(newCountries.length > 0 ? newCountries : undefined);
    } else {
      setCountry([...currentCountries, country]);
    }
  };

  const isDatePresetActive = (preset: typeof DATE_PRESETS[number]): boolean => {
    if (!filters.dateRange) {
      return false;
    }

    const { start } = filters.dateRange;

    if (preset.days) {
      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - preset.days);
      return Math.abs(start.getTime() - expectedStart.getTime()) < 24 * 60 * 60 * 1000; // Within 1 day
    } else if (preset.months) {
      const expectedStart = new Date();
      expectedStart.setMonth(expectedStart.getMonth() - preset.months);
      return Math.abs(start.getTime() - expectedStart.getTime()) < 24 * 60 * 60 * 1000; // Within 1 day
    }

    return false;
  };

  const handleDatePreset = (preset: typeof DATE_PRESETS[number]) => {
    // Check if this preset is already active - if so, toggle it off
    if (isDatePresetActive(preset)) {
      setDateRange(undefined);
      return;
    }

    const end = new Date();
    let start: Date;

    if (preset.days) {
      start = new Date();
      start.setDate(start.getDate() - preset.days);
    } else if (preset.months) {
      start = new Date();
      start.setMonth(start.getMonth() - preset.months);
    } else {
      return;
    }

    setDateRange({ start, end });
  };

  const handleClearAll = () => {
    clearFilters();
  };

  const getEntityCount = () => filters.entityIds?.length || 0;
  const getCountryCount = () => filters.country?.length || 0;
  const getDateRangeCount = () => (filters.dateRange ? 1 : 0);
  const getActiveFilterCount = useAnalysisFiltersStore((state) => state.getActiveFilterCount);
  const hasActiveFilters = getActiveFilterCount() > 0;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      PaperProps={{
        className: styles.popoverPaper,
      }}
    >
      <Box className={styles.popoverContent}>
        {/* Header */}
        <Box className={styles.header}>
          <Typography variant="h6" className={styles.title}>
            Filter by
          </Typography>
          <Button
            onClick={handleClearAll}
            disabled={!hasActiveFilters}
            variant="outlined"
            className={styles.clearAllButton}
          >
            Clear all
          </Button>
        </Box>

        {/* Filter Columns */}
        <Box className={styles.columns}>
          {/* Entities Column */}
          <Box className={styles.column}>
            <Typography variant="body1" className={styles.columnHeader}>
              Entities{getEntityCount() > 0 ? ` / ${getEntityCount()}` : ''}
            </Typography>
            <Box className={styles.optionsList}>
              {entities.map((entity) => {
                const isSelected = filters.entityIds?.includes(entity._id) || false;
                return (
                  <Chip
                    key={entity._id}
                    label={entity.entity_name || 'Unnamed Entity'}
                    onClick={() => handleEntityToggle(entity._id)}
                    className={`${styles.filterChip} ${isSelected ? styles.selected : ''}`}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Country Column */}
          <Box className={styles.column}>
            <Typography variant="body1" className={styles.columnHeader}>
              Country{getCountryCount() > 0 ? ` / ${getCountryCount()}` : ''}
            </Typography>
            <Box className={styles.optionsList}>
              {countriesLoading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              ) : (
                countries.map((country) => {
                  const isSelected = filters.country?.includes(country) || false;
                  return (
                    <Chip
                      key={country}
                      label={country}
                      onClick={() => handleCountryToggle(country)}
                      className={`${styles.filterChip} ${isSelected ? styles.selected : ''}`}
                    />
                  );
                })
              )}
            </Box>
          </Box>

          {/* Date Range Column */}
          <Box className={styles.column}>
            <Typography variant="body1" className={styles.columnHeader}>
              Date Range{getDateRangeCount() > 0 ? ` / ${getDateRangeCount()}` : ''}
            </Typography>
            <Box className={styles.optionsList}>
              {DATE_PRESETS.map((preset) => {
                const isSelected = isDatePresetActive(preset);
                return (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    onClick={() => handleDatePreset(preset)}
                    className={`${styles.filterChip} ${isSelected ? styles.selected : ''}`}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Popover>
  );
};

