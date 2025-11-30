// Widget types - mirroring backend schema and DTOs

export enum WidgetType {
  PIE = 'pie',
  BAR = 'bar',
  LINE = 'line',
  METRIC = 'metric',
  BATTERY = 'battery',
}

export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  filters?: {
    dateRange?: { start: Date | string; end: Date | string };
    entityIds?: string[];
    [key: string]: any;
  };
}

export interface WidgetDisplayConfig {
  title: string;
  showLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  colors?: string[];
  axisLabels?: { x?: string; y?: string };
}

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Request types (for creating/updating widgets)
export interface CreateWidgetRequest {
  type: WidgetType;
  dataConfig: WidgetDataConfig;
  displayConfig: WidgetDisplayConfig;
  layout?: WidgetLayout;
}

export interface UpdateWidgetRequest {
  type?: WidgetType;
  dataConfig?: WidgetDataConfig;
  displayConfig?: WidgetDisplayConfig;
  layout?: WidgetLayout;
  isActive?: boolean;
}

// Response types (from backend)
export interface Widget {
  id: string;
  userId: string;
  type: WidgetType;
  dataConfig: WidgetDataConfig;
  displayConfig: WidgetDisplayConfig;
  layout?: WidgetLayout;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  data?: ChartDataPoint[];
  dataUpdatedAt?: Date | string;
}

export interface WidgetListResponse {
  widgets: Widget[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface WidgetDataResponse {
  widgetId: string;
  type: string;
  data: ChartDataPoint[];
  timestamp: Date | string;
}

