import React from 'react';
import { Typography } from '@mui/material';
import { WidgetPaper } from '../components/analysis/WidgetPaper';
import type { Widget, WidgetType } from '../types/widget';
import { WIDGET_GRID_SIZES } from '../constants/gridConstants';
import { useAnalysisGrid } from '../hooks/analysis/useAnalysisGrid';
import styles from './AnalysisPage.module.scss';

const AnalysisPage: React.FC = () => {
  const { gridRef, columns, unitSize } = useAnalysisGrid();
  const mockWidgets: Widget[] = [
    {
      id: 'demo-pie-1',
      userId: 'demo-user',
      type: 'pie' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Category',
        yAxisField: 'Revenue',
      },
      displayConfig: {
        title: 'Revenue by Category',
        showLegend: true,
        showLabels: true,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-bar-1',
      userId: 'demo-user',
      type: 'bar' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Month',
        yAxisField: 'Amount',
      },
      displayConfig: {
        title: 'Monthly Revenue',
        showGridLines: true,
        axisLabels: { x: 'Month', y: 'Amount (€)' },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-line-1',
      userId: 'demo-user',
      type: 'line' as WidgetType,
      dataConfig: {
        source: 'invoices',
        xAxisField: 'Date',
        yAxisField: 'Revenue',
      },
      displayConfig: {
        title: 'Revenue Trend',
        showGridLines: true,
        axisLabels: { x: 'Date', y: 'Revenue (€)' },
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'demo-metric-1',
      userId: 'demo-user',
      type: 'metric' as WidgetType,
      dataConfig: {
        source: 'invoices',
        yAxisField: 'Total',
      },
      displayConfig: {
        title: 'Total Revenue',
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Analysis
        </Typography>
        <Typography variant="body1" className={styles.subtitle}>
          Widget dashboard
        </Typography>
      </div>
      <div className={styles.content}>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{
            gridTemplateColumns: `repeat(${columns}, ${unitSize}px)`,
            gridAutoRows: `${unitSize}px`,
          }}
        >
          {mockWidgets.map((widget) => {
            const gridSize = WIDGET_GRID_SIZES[widget.type];
            return (
              <div
                key={widget.id}
                className={styles.widget}
                style={{
                  gridColumn: `span ${gridSize.columns}`,
                  gridRow: `span ${gridSize.rows}`,
                }}
              >
                <WidgetPaper widget={widget} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 