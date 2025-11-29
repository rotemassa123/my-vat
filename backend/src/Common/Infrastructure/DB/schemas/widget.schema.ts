import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { UserScopePlugin } from '../../../../Common/plugins/user-scope.plugin';

export type WidgetDocument = HydratedDocument<Widget>;

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
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export interface WidgetFilters {
  dateRange?: {
    start: Date;
    end: Date;
    field?: string;
  };
  
  [field: string]: any;
}

export interface WidgetDataConfig {
  xAxisField?: string;
  yAxisField?: string;
  aggregation?: AggregationType;
  timeGrouping?: TimeGrouping;
  timeField?: string;
  filters?: WidgetFilters;
}

export interface AxisConfig {
  label?: string;
  format?: string;
}

export interface WidgetDisplayConfig {
  title: string;
  subtitle?: string;
  
  showLabels?: boolean;
  showLegend?: boolean;
  showGridLines?: boolean;
  colors?: string[];
  
  axisLabels?: {
    x?: AxisConfig;
    y?: AxisConfig;
  };
}

export interface LayoutPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetLayout {
  '4'?: LayoutPosition;
  '6'?: LayoutPosition;
  '8'?: LayoutPosition;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'widgets' })
export class Widget {
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: MongooseSchema.Types.ObjectId;
  
  // This property is defined for TypeScript type safety; the actual schema field is created by UserScopePlugin.
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

  @Prop({ type: MongooseSchema.Types.Mixed })
  data?: ChartDataPoint[];

  @Prop()
  data_updated_at?: Date;

  created_at: Date;
  updated_at: Date;
}

export const WidgetSchema = SchemaFactory.createForClass(Widget);
WidgetSchema.plugin(AccountScopePlugin);
WidgetSchema.plugin(UserScopePlugin);
WidgetSchema.index({ user_id: 1, is_active: 1 });
WidgetSchema.index({ account_id: 1, user_id: 1 });

