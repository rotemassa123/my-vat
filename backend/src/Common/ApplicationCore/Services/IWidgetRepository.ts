import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetType, WidgetDataConfig, WidgetDisplayConfig, WidgetLayout } from 'src/Common/Infrastructure/DB/schemas/widget.schema';

export interface CreateWidget {
  type: WidgetType;
  dataConfig: WidgetDataConfig;
  displayConfig: WidgetDisplayConfig;
  layout?: WidgetLayout;
  // userId and accountId are automatically set by plugins from user context
}

export interface UpdateWidget {
  type?: WidgetType;
  dataConfig?: WidgetDataConfig;
  displayConfig?: WidgetDisplayConfig;
  layout?: WidgetLayout;
  isActive?: boolean;
  data?: Array<{ label: string; value: number }>;
  dataUpdatedAt?: Date;
}

export interface IWidgetRepository {
  create(data: CreateWidget): Promise<WidgetDocument>;
  findById(id: string): Promise<WidgetDocument | null>;
  findAll(): Promise<WidgetDocument[]>;
  update(id: string, data: UpdateWidget): Promise<WidgetDocument | null>;
  delete(id: string): Promise<boolean>;
}

