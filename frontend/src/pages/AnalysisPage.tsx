import React from 'react';
import { Typography, CircularProgress, Box } from '@mui/material';
import { WidgetPaper } from '../components/analysis/WidgetPaper';
import { FilterButton } from '../components/analysis/FilterButton';
import { useActiveWidgets } from '../store/widgetStore';
import { WIDGET_GRID_SIZES } from '../constants/gridConstants';
import { useAnalysisGrid } from '../hooks/analysis/useAnalysisGrid';
import { useGlobalFilters } from '../hooks/analysis/useGlobalFilters';
import { useRefreshWidgets } from '../hooks/analysis/useRefreshWidgets';
import styles from './AnalysisPage.module.scss';

const AnalysisPage: React.FC = () => {
  const { gridRef, columns, unitSize } = useAnalysisGrid();
  const widgets = useActiveWidgets();
  useGlobalFilters(); // Initialize URL sync
  const { isRefreshing } = useRefreshWidgets(); // Auto-refresh when filters change

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Typography variant="h4" className={styles.title}>
          Analysis
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isRefreshing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Refreshing widgets...
              </Typography>
            </Box>
          )}
          <FilterButton />
        </Box>
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