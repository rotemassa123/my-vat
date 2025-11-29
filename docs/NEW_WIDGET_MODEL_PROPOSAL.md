# New Widget Model Structure

```typescript
export enum WidgetType {
  PIE = 'pie',
  BAR = 'bar',
  LINE = 'line',
  METRIC = 'metric',
  BATTERY = 'battery',
}

export enum AggregationType {
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  PERCENTAGE = 'percentage',
}

export enum TimeGrouping {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface RangeBucket {
  min?: number;
  max?: number;
  label?: string;
}

export interface WidgetFilters {
  // Date range filter
  dateRange?: {
    start: Date;
    end: Date;
    field?: string;
  };
  
  // Generic field filters: fieldName -> value(s)
  // Examples: { status: ['claimable', 'accepted'], country: ['GB', 'US'] }
  [field: string]: any;
}

export interface WidgetDataConfig {
  xAxisField?: string;
  yAxisField?: string;
  aggregation?: AggregationType;
  timeGrouping?: TimeGrouping;
  timeField?: string;
  filters?: WidgetFilters;
  
  // Widget-specific configs (optional, only when needed)
  [key: string]: any;
}

export interface WidgetDisplayConfig {
  title: string;
  subtitle?: string;
  
  // Generic display options
  showLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  colors?: string[];
  
  // Generic axis config
  axisLabels?: {
    x?: {
      label?: string;
      format?: string;
      [key: string]: any;
    };
    y?: {
      label?: string;
      format?: string;
      [key: string]: any;
    };
  };
  
  // Widget-specific configs (optional, only when needed)
  [key: string]: any;
}

export interface WidgetLayout {
  // Layouts for different column counts
  "4"?: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  "6"?: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  "8"?: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'widgets' })
export class Widget {
  account_id: MongooseSchema.Types.ObjectId;
  entity_id?: MongooseSchema.Types.ObjectId;
  user_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: WidgetType })
  type: WidgetType;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  data_config: WidgetDataConfig;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  display_config: WidgetDisplayConfig;

  @Prop({ type: MongooseSchema.Types.Mixed })
  layout?: WidgetLayout;

  @Prop({ default: true })
  is_active: boolean;

  created_at: Date;
  updated_at: Date;
}
```
