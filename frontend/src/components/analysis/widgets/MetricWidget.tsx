import React from 'react';
import { Box, Typography } from '@mui/material';
import type { Widget } from '../../../types/widget';
import widgetDemoData from '../../../data/widgetDemoData.json';
import styles from './MetricWidget.module.scss';

interface MetricWidgetProps {
  widget: Widget;
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({ widget }) => {
  // For metric widgets, we use the first value from the demo data
  // In a real implementation, this would come from the widget's dataConfig
  const data = widgetDemoData.metric as { value: number; label?: string };
  const value = data?.value ?? 0;

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
        {data?.label && (
          <Typography variant="body2" className={styles.label}>
            {data.label}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

