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
    stack: 'total', // Stack all series together
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
          },
        ]}
        yAxis={[
          {
            id: 'batteryYAxis',
            data: ['Tasks'],
            scaleType: 'band',
            tickLabelStyle: tickLabelStyle,
          },
        ]}
        series={series}
        grid={{
          vertical: widget.displayConfig.showGridLines !== false,
          horizontal: widget.displayConfig.showGridLines !== false,
        }}
        width={width || CHART_DIMENSIONS.DEFAULT_WIDTH}
        height={height || CHART_DIMENSIONS.DEFAULT_HEIGHT}
        margin={CHART_MARGINS.DEFAULT}
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

