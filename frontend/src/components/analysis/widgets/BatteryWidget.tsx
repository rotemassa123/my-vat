import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box } from '@mui/material';
import type { Widget, ChartDataPoint } from '../../../types/widget';
import widgetDemoData from '../../../data/widgetDemoData.json';
import {
  CHART_COLORS,
  CHART_TYPOGRAPHY,
  CHART_MARGINS,
  CHART_DIMENSIONS,
} from '../../../constants/chartConstants';
import styles from './BatteryWidget.module.scss';

interface BatteryWidgetProps {
  widget: Widget;
  width?: number;
  height?: number;
}

export const BatteryWidget: React.FC<BatteryWidgetProps> = ({ widget, width, height }) => {
  const chartWidth = width || CHART_DIMENSIONS.DEFAULT_WIDTH;
  const data = widgetDemoData.battery as ChartDataPoint[];

  const tickLabelStyle = {
    fontSize: CHART_TYPOGRAPHY.TICK_FONT_SIZE,
    fontWeight: CHART_TYPOGRAPHY.TICK_FONT_WEIGHT,
    fill: CHART_COLORS.TEXT_SECONDARY,
  };

  // Calculate total for percentage calculation
  const total = data.reduce((sum, point) => sum + point.value, 0);

  // Create stacked series data - each segment is a separate series
  // Let Material-UI pick the colors automatically
  const series = data.map((point) => ({
    data: [point.value],
    label: point.label,
    stack: 'total',

    valueFormatter: (value: number | null) => {
      if (value === null) return '';
      const percentage = ((value / total) * 100).toFixed(1);
      return `${percentage}%`;
    },
  }));

  return (
    <Box className={styles.chartBox}>
      <BarChart
        layout="horizontal"
        xAxis={[
          {
            id: 'batteryXAxis',
            max: 100,
            tickLabelStyle: tickLabelStyle,
            disableLine: true,
            tickSize: 0,
          },
        ]}
        yAxis={[
          {
            id: 'batteryYAxis',
            data: [''], // Empty label to remove the "Tasks" subtitle
            scaleType: 'band',
            tickLabelStyle: tickLabelStyle,
            disableLine: true,
            tickSize: 0,
          },
        ]}
        series={series}
        grid={{
          vertical: widget.displayConfig.showGridLines !== false,
          horizontal: false,
        }}
        width={chartWidth}
        height={height ? Math.min(height, 80) : 80} // Reduced height to make bar appear thinner
        margin={{
          ...CHART_MARGINS.DEFAULT,
          left: 4,
          right: 12,
          bottom: 10,
        }}
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
        tooltip={{
          trigger: 'item',
        }}
      />
    </Box>
  );
};

