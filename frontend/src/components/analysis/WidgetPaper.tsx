import React, { useRef, useEffect, useState } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import type { Widget } from '../../types/widget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { BarChartWidget } from './widgets/BarChartWidget';
import { LineChartWidget } from './widgets/LineChartWidget';
import { MetricWidget } from './widgets/MetricWidget';
import { BatteryWidget } from './widgets/BatteryWidget';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WIDGET_GRID_SIZES } from '../../constants/gridConstants';
import styles from './WidgetPaper.module.scss';

interface WidgetPaperProps {
  widget: Widget;
}

export const WidgetPaper: React.FC<WidgetPaperProps> = ({ widget }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 400, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect();
        // Use actual container dimensions instead of forcing square
        setChartDimensions({ width, height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [widget.id]);

  const chartProps = { widget, width: chartDimensions.width, height: chartDimensions.height };

  // Calculate aspect ratio based on widget grid dimensions
  // Each grid unit is square, so aspect ratio = columns / rows
  const gridSize = WIDGET_GRID_SIZES[widget.type];
  const aspectRatio = gridSize ? gridSize.columns / gridSize.rows : 1;

  return (
    <Paper 
      elevation={2} 
      className={styles.paper}
      style={{ aspectRatio }}
    >
      <Typography variant="h6" className={styles.title}>
        {widget.displayConfig.title}
      </Typography>
      <Box ref={chartContainerRef} className={styles.chartContainer}>
        <WidgetErrorBoundary>
          {widget.type === 'pie' && <PieChartWidget {...chartProps} />}
          {widget.type === 'bar' && <BarChartWidget {...chartProps} />}
          {widget.type === 'line' && <LineChartWidget {...chartProps} />}
          {widget.type === 'metric' && <MetricWidget widget={widget} />}
          {widget.type === 'battery' && <BatteryWidget {...chartProps} />}
          {!['pie', 'bar', 'line', 'metric', 'battery'].includes(widget.type) && (
            <div>Unsupported widget type: {widget.type}</div>
          )}
        </WidgetErrorBoundary>
      </Box>
    </Paper>
  );
};

