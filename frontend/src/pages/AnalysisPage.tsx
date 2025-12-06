import React from 'react';
import { Typography } from '@mui/material';
import { WidgetPaper } from '../components/analysis/WidgetPaper';
import { useActiveWidgets } from '../store/widgetStore';
import { WIDGET_GRID_SIZES } from '../constants/gridConstants';
import { useAnalysisGrid } from '../hooks/analysis/useAnalysisGrid';
import styles from './AnalysisPage.module.scss';

const AnalysisPage: React.FC = () => {
  const { gridRef, columns, unitSize } = useAnalysisGrid();
  const widgets = useActiveWidgets();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Analysis
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
          {widgets.length === 0 ? (
            <div className={styles.emptyState}>
              <Typography variant="body1" color="text.secondary">
                No widgets available. Create your first widget to get started.
              </Typography>
            </div>
          ) : (
            widgets.map((widget) => {
              const gridSize = WIDGET_GRID_SIZES[widget.type] || { columns: 2, rows: 2 };
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
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage; 