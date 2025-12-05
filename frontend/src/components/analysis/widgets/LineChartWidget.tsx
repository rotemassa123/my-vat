import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Box } from '@mui/material';
import type { Widget, ChartDataPoint } from '../../../types/widget';
import { CHART_COLORS, CHART_TYPOGRAPHY, CHART_MARGINS, CHART_DIMENSIONS, Y_AXIS_SCALE, LINE_CHART_CONFIG } from '../../../constants/chartConstants';
import styles from './LineChartWidget.module.scss';

interface LineChartWidgetProps {
  widget: Widget;
  width?: number;
  height?: number;
}

const tickLabelStyle = {
  fontSize: CHART_TYPOGRAPHY.TICK_FONT_SIZE,
  fontWeight: CHART_TYPOGRAPHY.TICK_FONT_WEIGHT,
  fill: CHART_COLORS.TEXT_SECONDARY,
};

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({ widget, width, height }) => {
  const data = (widget.data || []) as ChartDataPoint[];
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  
  // Calculate dynamic Y-axis range with padding
  // Add 10% padding at the bottom and 10% at the top for better visibility
  const range = maxValue - minValue;
  const padding = Math.max(range * 0.1, maxValue * 0.05); // At least 5% of max value as padding
  const yAxisMin = Math.max(0, minValue - padding); // Don't go below 0
  const yAxisMax = maxValue + padding;

  return (
    <Box className={styles.container}>
      <LineChart
        xAxis={[{
          id: 'lineCategories',
          data: data.map((d) => d.label),
          scaleType: 'point',
          tickLabelStyle,
        }]}
        series={[{
          data: values,
          curve: 'linear',
          color: CHART_COLORS.PRIMARY
        }]}
        yAxis={[{
          min: yAxisMin,
          max: yAxisMax,
          tickLabelStyle,
          valueFormatter: (value) => (value === yAxisMin ? '' : value.toString()),
        }]}
        grid={{
          vertical: widget.displayConfig.showGridLines !== false,
          horizontal: widget.displayConfig.showGridLines !== false,
        }}
        width={width || CHART_DIMENSIONS.DEFAULT_WIDTH}
        height={height || CHART_DIMENSIONS.DEFAULT_HEIGHT}
        margin={CHART_MARGINS.DEFAULT}
        slotProps={{ legend: { hidden: true } }}
      />
    </Box>
  );
};

