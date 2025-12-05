import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import type { Widget, ChartDataPoint } from '../../../types/widget';
import { CHART_DIMENSIONS, CHART_MARGINS } from '../../../constants/chartConstants';

interface PieChartWidgetProps {
  widget: Widget;
  width?: number;
  height?: number;
}

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({ widget, width, height }) => {
  const data = (widget.data || []) as ChartDataPoint[];
  const pieChartData = data.map((point, index) => ({ id: index, value: point.value, label: point.label }));

  return (
    <PieChart
      series={[{
        data: pieChartData,
        outerRadius: '80%',
        arcLabel: undefined,
        highlightScope: { fade: 'global', highlight: 'item' },
      }]}
      width={width || CHART_DIMENSIONS.PIE_WIDTH}
      height={height || CHART_DIMENSIONS.PIE_HEIGHT}
      margin={CHART_MARGINS.PIE}
      slotProps={{
        legend: { direction: 'row', position: { vertical: 'bottom', horizontal: 'middle' } },
      }}
    />
  );
};

