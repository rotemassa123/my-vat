import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export interface CreateWidgetData {
  type: WidgetType;
  dataConfig: WidgetDataConfig;
  displayConfig: WidgetDisplayConfig;
  layout?: WidgetLayout;
  // userId and accountId are automatically set by plugins from user context
}

export interface UpdateWidgetData {
  type?: WidgetType;
  dataConfig?: WidgetDataConfig;
  displayConfig?: WidgetDisplayConfig;
  layout?: WidgetLayout;
  isActive?: boolean;
}

export interface IWidgetRepository {
  create(data: CreateWidgetData): Promise<WidgetDocument>;
  findById(id: string): Promise<WidgetDocument | null>;
  findAll(): Promise<WidgetDocument[]>;
  update(id: string, data: UpdateWidgetData): Promise<WidgetDocument | null>;
  delete(id: string): Promise<boolean>;
}

