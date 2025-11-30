import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetDataConfig } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { logger } from 'src/Common/Infrastructure/Config/Logger';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Injectable()
export class WidgetDataService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    // Add other models (Summary, Entity) as needed
  ) {}

  async fetchWidgetData(widget: WidgetDocument): Promise<ChartDataPoint[]> {
    const config = widget.data_config as WidgetDataConfig;
    
    // Determine data source based on fields used
    // If xAxisField or yAxisField requires summary data (e.g., country, supplier), use summaries
    // Otherwise, use invoices as default
    const needsSummaryData = this.requiresSummaryData(config);
    
    if (needsSummaryData) {
      return this.fetchSummaryData(config);
    }
    
    // Default to invoices
    return this.fetchInvoiceData(config);
  }

  private requiresSummaryData(config: WidgetDataConfig): boolean {
    const summaryFields = ['country', 'supplier', 'vendor_name', 'currency', 'vat_rate', 'classification', 'category'];
    const xField = config.xAxisField?.toLowerCase();
    const yField = config.yAxisField?.toLowerCase();
    
    return summaryFields.some(field => 
      xField?.includes(field) || yField?.includes(field)
    );
  }

  private async fetchInvoiceData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.xAxisField || !config.yAxisField) return [];

    const pipeline: any[] = [];

    const matchStage: any = {};
    if (config.filters?.dateRange) {
      matchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Map field names to actual DB fields
    // xAxisField options: 'Date', 'Category', 'Product', 'Region' -> map to invoice fields
    // yAxisField options: 'Revenue', 'Count', 'Percentage', 'Value' -> map to invoice fields
    const xAxisDbField = this.mapXAxisFieldToDb(config.xAxisField);
    const yAxisDbField = this.mapYAxisFieldToDb(config.yAxisField);

    // Group by X-axis, aggregate Y-axis
    pipeline.push({
      $group: {
        _id: `$${xAxisDbField}`,
        value: this.getAggregationOperation(yAxisDbField, config.yAxisField),
      },
    });

    // Sort
    if (config.xAxisField.toLowerCase() === 'date') {
      pipeline.push({ $sort: { _id: 1 } });
    } else {
      pipeline.push({ $sort: { value: -1 } });
    }

    try {
      const results = await this.invoiceModel.aggregate(pipeline).exec();
      return results.map((result: any) => ({
        label: String(result._id || 'Unknown'),
        value: result.value || 0,
      }));
    } catch (error) {
      logger.error('Error fetching invoice data for widget', 'WidgetDataService', { error, config });
      throw error;
    }
  }

  // Map user-friendly field names to actual database field names
  private mapXAxisFieldToDb(field: string): string {
    const mapping: Record<string, string> = {
      'Date': 'created_at',
      'Category': 'source', // or appropriate category field
      'Product': 'name', // or appropriate product field
      'Region': 'country', // from summary_content if available
    };
    return mapping[field] || field.toLowerCase();
  }

  private mapYAxisFieldToDb(field: string): string {
    const mapping: Record<string, string> = {
      'Revenue': 'claim_amount', // or total_amount from summary
      'Value': 'claim_amount',
      'Amount': 'claim_amount',
      'Count': '_id', // Will use $sum: 1 for count
    };
    return mapping[field] || field.toLowerCase();
  }

  private getAggregationOperation(yAxisDbField: string, yAxisField: string): any {
    // For Count, always use $sum: 1
    if (yAxisField === 'Count' || yAxisField === 'Percentage') {
      return { $sum: 1 };
    }
    // For numeric fields, sum the field value
    // Note: If field doesn't exist in invoice, may need to join with summary
    return { $sum: `$${yAxisDbField}` };
  }

  private async fetchSummaryData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    // Similar MongoDB aggregation pipeline for summaries
    // TODO: Implement based on Summary schema
    return [];
  }

  private async fetchEntityData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    // Similar MongoDB aggregation pipeline for entities
    // TODO: Implement based on Entity schema
    return [];
  }
}

