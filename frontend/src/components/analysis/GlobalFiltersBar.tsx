import React from 'react';
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  Typography,
  TextField,
} from '@mui/material';
import { useGlobalFilters } from '../../hooks/analysis/useGlobalFilters';
import { useAccountStore } from '../../store/accountStore';
import { useCountryOptions } from '../../hooks/analysis/useCountryOptions';
import styles from './GlobalFiltersBar.module.scss';

export const GlobalFiltersBar: React.FC = () => {
  const { filters, setEntityIds, setCountry, setDateRange } = useGlobalFilters();
  const { entities } = useAccountStore();
  const { countries, isLoading: countriesLoading } = useCountryOptions();

  const handleEntityChange = (event: any) => {
    const value = event.target.value;
    if (value === '') {
      setEntityIds(undefined);
    } else {
      setEntityIds(Array.isArray(value) ? value : [value]);
    }
  };

  const handleCountryChange = (event: any) => {
    const value = event.target.value;
    setCountry(value === '' ? undefined : value);
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      const date = new Date(dateString);
      setDateRange({
        start: date,
        end: filters.dateRange?.end || new Date(),
      });
    } else if (!filters.dateRange?.end) {
      setDateRange(undefined);
    } else {
      setDateRange({
        start: new Date(0),
        end: filters.dateRange.end,
      });
    }
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      const date = new Date(dateString);
      setDateRange({
        start: filters.dateRange?.start || new Date(0),
        end: date,
      });
    } else if (!filters.dateRange?.start) {
      setDateRange(undefined);
    } else {
      setDateRange({
        start: filters.dateRange.start,
        end: new Date(),
      });
    }
  };

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <Box className={styles.filtersBar}>
      <Typography variant="body2" className={styles.label}>
        Filters:
      </Typography>

      {/* Entity Filter */}
      <FormControl size="small" className={styles.filterControl}>
        <Select
          multiple
          value={filters.entityIds || []}
          onChange={handleEntityChange}
          displayEmpty
          renderValue={(selected) => {
            if (!selected || selected.length === 0) {
              return 'All Entities';
            }
            if (selected.length === 1) {
              const entity = entities.find(e => e._id === selected[0]);
              return entity?.name || 'Selected';
            }
            return `${selected.length} Entities`;
          }}
        >
          <MenuItem value="">
            <em>All Entities</em>
          </MenuItem>
          {entities.map((entity) => (
            <MenuItem key={entity._id} value={entity._id}>
              {entity.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Country Filter */}
      <FormControl size="small" className={styles.filterControl}>
        <Select
          value={filters.country || ''}
          onChange={handleCountryChange}
          displayEmpty
          disabled={countriesLoading}
        >
          <MenuItem value="">
            <em>All Countries</em>
          </MenuItem>
          {countries.map((country) => (
            <MenuItem key={country} value={country}>
              {country}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date Range Filter */}
      <Box className={styles.dateRangeContainer}>
        <TextField
          label="Start Date"
          type="date"
          size="small"
          value={formatDateForInput(filters.dateRange?.start)}
          onChange={handleStartDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          className={styles.datePicker}
        />
        <Typography variant="body2" className={styles.dateSeparator}>
          to
        </Typography>
        <TextField
          label="End Date"
          type="date"
          size="small"
          value={formatDateForInput(filters.dateRange?.end)}
          onChange={handleEndDateChange}
          InputLabelProps={{
            shrink: true,
          }}
          className={styles.datePicker}
        />
      </Box>
    </Box>
  );
};

