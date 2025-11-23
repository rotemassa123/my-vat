import React, { useRef, useEffect, useState } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import type { Widget } from '../../types/widget';
import { PieChartWidget } from './widgets/PieChartWidget';
import { BarChartWidget } from './widgets/BarChartWidget';
import { LineChartWidget } from './widgets/LineChartWidget';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
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
        const size = Math.min(width, height);
        setChartDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const chartProps = { widget, width: chartDimensions.width, height: chartDimensions.height };

  return (
    <Paper elevation={2} className={styles.paper}>
      <Typography variant="h6" className={styles.title}>
        {widget.displayConfig.title} (€)
      </Typography>
      <Box ref={chartContainerRef} className={styles.chartContainer}>
        <WidgetErrorBoundary>
          {widget.type === 'pie' && <PieChartWidget {...chartProps} />}
          {widget.type === 'bar' && <BarChartWidget {...chartProps} />}
          {widget.type === 'line' && <LineChartWidget {...chartProps} />}
          {!['pie', 'bar', 'line'].includes(widget.type) && (
            <div>Unsupported widget type: {widget.type}</div>
          )}
        </WidgetErrorBoundary>
      </Box>
    </Paper>
  );
};

