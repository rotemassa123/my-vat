import type { WidgetType } from '../types/widget';

// Grid system constants
// The page is divided into a 4x4 grid of grid units
// Each widget type has its own grid dimensions

export const GRID_CONFIG = {
  COLUMNS: 4, // 4 grid units per row
  ROWS: 4, // 4 rows visible initially
  GAP: '1.5rem', // Gap between widgets
};

// Widget type to grid dimensions mapping (columns x rows in grid units)
export const WIDGET_GRID_SIZES: Record<WidgetType, { columns: number; rows: number }> = {
  pie: { columns: 2, rows: 2 },
  bar: { columns: 2, rows: 2 },
  line: { columns: 2, rows: 2 },
};

