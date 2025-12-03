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
  const maxValue = Math.max(...data.map((d) => d.value));
  const yAxisMin = Y_AXIS_SCALE.LINE_MIN;
  const yAxisMax = (maxValue - yAxisMin) / Y_AXIS_SCALE.LINE_MAX_RATIO + yAxisMin;

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
          data: data.map((d) => d.value),
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

