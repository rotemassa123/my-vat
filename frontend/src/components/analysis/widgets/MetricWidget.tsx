import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Widget, ChartDataPoint } from '../../../types/widget';
import styles from './MetricWidget.module.scss';

interface MetricWidgetProps {
  widget: Widget;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({ widget }) => {
  // For metric widgets, sum all values from the data array
  const data = (widget.data || []) as ChartDataPoint[];
  const value = data.reduce((sum, point) => sum + (point.value || 0), 0);

  // Format the number with thousand separators
  const formattedValue = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <Box className={styles.container}>
      <Box className={styles.content}>
        <Typography
          variant="h1"
          className={styles.value}
        >
          {formattedValue}
        </Typography>
        {widget.displayConfig.subtitle && (
          <Typography variant="body2" className={styles.label}>
            {widget.displayConfig.subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

