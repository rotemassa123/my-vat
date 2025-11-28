import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { EntityScopePlugin } from '../../../plugins/entity-scope.plugin';
import { UserScopePlugin } from '../../../../Common/plugins/user-scope.plugin';

export type WidgetDocument = HydratedDocument<Widget>;

export enum WidgetType {
  PIE = 'pie',
  BAR = 'bar',
  HISTOGRAM = 'histogram',
  LINE = 'line',
  METRIC = 'metric',
}

export interface WidgetDataConfig {
  source: 'invoices' | 'summaries' | 'entities' | 'custom';
  xAxisField?: string;
  yAxisField?: string;
  filters?: {
    dateRange?: { start: Date; end: Date };
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

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'widgets' })
export class Widget {
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: MongooseSchema.Types.ObjectId;
  
  // This property is defined for TypeScript type safety; the actual schema field is created by EntityScopePlugin.
  entity_id?: MongooseSchema.Types.ObjectId;
  
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

  created_at: Date;
  updated_at: Date;
}

export const WidgetSchema = SchemaFactory.createForClass(Widget);
WidgetSchema.plugin(AccountScopePlugin);
WidgetSchema.plugin(EntityScopePlugin, { is_required: false });
WidgetSchema.plugin(UserScopePlugin);
WidgetSchema.index({ user_id: 1, is_active: 1 });
WidgetSchema.index({ account_id: 1, user_id: 1 });

