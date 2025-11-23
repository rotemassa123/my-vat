import React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box } from '@mui/material';
import type { Widget, ChartDataPoint } from '../../../types/widget';
import widgetDemoData from '../../../data/widgetDemoData.json';
import { CHART_COLORS, CHART_TYPOGRAPHY, CHART_MARGINS, CHART_DIMENSIONS, Y_AXIS_SCALE } from '../../../constants/chartConstants';
import styles from './BarChartWidget.module.scss';

interface BarChartWidgetProps {
  widget: Widget;
  width?: number;
  height?: number;
}

const tickLabelStyle = {
  fontSize: CHART_TYPOGRAPHY.TICK_FONT_SIZE,
  fontWeight: CHART_TYPOGRAPHY.TICK_FONT_WEIGHT,
  fill: CHART_COLORS.TEXT_SECONDARY,
};

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ widget, width, height }) => {
  const data = widgetDemoData.bar as ChartDataPoint[];
  const yAxisMax = Math.max(...data.map((d) => d.value)) / Y_AXIS_SCALE.BAR_MAX_RATIO;

  return (
    <Box className={styles.container}>
      <BarChart
        xAxis={[{
          id: 'barCategories',
          data: data.map((d) => d.label),
          scaleType: 'band',
          tickLabelStyle,
        }]}
        series={[{ data: data.map((d) => d.value), color: CHART_COLORS.PRIMARY }]}
        yAxis={[{ max: yAxisMax, tickLabelStyle }]}
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

