import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetDataConfig } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Summary, SummaryDocument } from 'src/Common/Infrastructure/DB/schemas/summary.schema';
import { logger } from 'src/Common/Infrastructure/Config/Logger';

export interface ChartDataPoint {
  label: string;
  value: number;
}

@Injectable()
export class WidgetDataService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Summary.name) private summaryModel: Model<SummaryDocument>,
  ) {}

  async fetchWidgetData(widget: WidgetDocument): Promise<ChartDataPoint[]> {
    const config = widget.data_config as WidgetDataConfig;
    
    // Determine if we need data from both collections
    // Some graphs need invoice fields (status, claim_amount) AND summary fields (country, classification, total_amount)
    const needsInvoiceFields = this.requiresInvoiceFields(config);
    const needsSummaryFields = this.requiresSummaryFields(config);
    
    if (needsInvoiceFields && needsSummaryFields) {
      // Need both: join invoices with summaries
      return this.fetchJoinedData(config);
    } else if (needsSummaryFields) {
      // Only need summary data
      return this.fetchSummaryData(config);
    } else {
      // Default to invoices only
      return this.fetchInvoiceData(config);
    }
  }

  private requiresInvoiceFields(config: WidgetDataConfig): boolean {
    const invoiceFields = ['status', 'claim_amount', 'source', 'created_at', 'status_updated_at'];
    const xField = config.xAxisField?.toLowerCase();
    const yField = config.yAxisField?.toLowerCase();
    const filterKeys = Object.keys(config.filters || {});
    
    return invoiceFields.some(field => 
      xField?.includes(field) || 
      yField?.includes(field) ||
      filterKeys.some(key => key.toLowerCase().includes(field))
    );
  }

  private requiresSummaryFields(config: WidgetDataConfig): boolean {
    const summaryFields = ['country', 'supplier', 'vendor_name', 'currency', 'vat_rate', 'classification', 'category', 'total_amount', 'vat_amount', 'net_amount'];
    const xField = config.xAxisField?.toLowerCase();
    const yField = config.yAxisField?.toLowerCase();
    const filterKeys = Object.keys(config.filters || {});
    
    return summaryFields.some(field => 
      xField?.includes(field) || 
      yField?.includes(field) ||
      filterKeys.some(key => key.toLowerCase().includes(field))
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

  /**
   * Fetch data by joining invoices with summaries
   * Used when widget needs fields from both collections (e.g., "claimable amount by country")
   */
  /**
   * Example usage:
   * 
   * Input config:
   * {
   *   xAxisField: "country",
   *   yAxisField: "total_amount",
   *   filters: { status: "claimable" }
   * }
   * 
   * Sample data:
   * Invoices:
   *   { _id: "inv1", name: "invoice1.pdf", status: "claimable", created_at: "2024-01-15" }
   *   { _id: "inv2", name: "invoice2.pdf", status: "claimable", created_at: "2024-01-16" }
   *   { _id: "inv3", name: "invoice3.pdf", status: "not_claimable", created_at: "2024-01-17" }
   * 
   * Summaries:
   *   { file_name: "invoice1.pdf", summary_content: { country: "GB", total_amount: "1000.00" } }
   *   { file_name: "invoice2.pdf", summary_content: { country: "GB", total_amount: "2000.00" } }
   *   { file_name: "invoice3.pdf", summary_content: { country: "FR", total_amount: "1500.00" } }
   * 
   * Pipeline steps:
   * 1. $match: { status: "claimable" } -> filters to inv1, inv2
   * 2. $lookup: joins summaries -> inv1+sum1, inv2+sum2
   * 3. $unwind: flattens summary -> inv1+sum1, inv2+sum2
   * 4. $group: { _id: "$summary.summary_content.country", value: sum(total_amount) }
   *    -> { _id: "GB", value: 3000.00 }
   * 5. $sort: { value: -1 }
   * 
   * Expected output:
   * [
   *   { label: "GB", value: 3000.00 }
   * ]
   */
  private async fetchJoinedData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.xAxisField || !config.yAxisField) return [];

    const pipeline: any[] = [];

    // Start with invoices
    const matchStage: any = {};
    if (config.filters?.dateRange) {
      matchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    // Add invoice-specific filters (e.g., status)
    if (config.filters?.status) {
      matchStage.status = config.filters.status;
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Join with summaries using invoice.name === summary.file_name
    pipeline.push({
      $lookup: {
        from: 'summaries',
        localField: 'name',
        foreignField: 'file_name',
        as: 'summary'
      }
    });

    // Unwind summary (should be 0 or 1 match per invoice)
    pipeline.push({
      $unwind: {
        path: '$summary',
        preserveNullAndEmptyArrays: true // Keep invoices without summaries
      }
    });

    // Add summary-based filters
    const summaryMatchStage: any = {};
    if (config.filters?.country && pipeline.length > 0) {
      summaryMatchStage['summary.summary_content.country'] = config.filters.country;
    }
    if (config.filters?.classification && pipeline.length > 0) {
      summaryMatchStage['summary.summary_content.classification'] = config.filters.classification;
    }
    if (config.filters?.category && pipeline.length > 0) {
      summaryMatchStage['summary.summary_content.category'] = config.filters.category;
    }
    if (Object.keys(summaryMatchStage).length > 0) {
      pipeline.push({ $match: summaryMatchStage });
    }

    // Map fields to actual DB paths (handling both invoice and summary fields)
    const xAxisDbPath = this.mapXAxisFieldToJoinedPath(config.xAxisField);
    const yAxisDbPath = this.mapYAxisFieldToJoinedPath(config.yAxisField);

    // Group by X-axis, aggregate Y-axis
    pipeline.push({
      $group: {
        _id: xAxisDbPath,
        value: this.getAggregationOperationForJoined(yAxisDbPath, config.yAxisField),
      },
    });

    // Sort
    if (config.xAxisField.toLowerCase() === 'date' || config.xAxisField.toLowerCase().includes('time')) {
      pipeline.push({ $sort: { _id: 1 } });
    } else {
      pipeline.push({ $sort: { value: -1 } });
    }

    try {
      // Log pipeline for debugging (can be removed in production or made conditional)
      logger.debug('Executing joined data pipeline', 'WidgetDataService', {
        xAxisField: config.xAxisField,
        yAxisField: config.yAxisField,
        xAxisDbPath,
        yAxisDbPath,
        pipeline: JSON.stringify(pipeline, null, 2),
      });

      const results = await this.invoiceModel.aggregate(pipeline).exec();
      
      const chartData = results.map((result: any) => ({
        label: String(result._id || 'Unknown'),
        value: result.value || 0,
      }));

      logger.debug('Joined data query results', 'WidgetDataService', {
        resultCount: chartData.length,
        sampleResult: chartData[0] || null,
      });

      return chartData;
    } catch (error) {
      logger.error('Error fetching joined data for widget', 'WidgetDataService', { error, config, pipeline });
      throw error;
    }
  }

  private mapXAxisFieldToJoinedPath(field: string): string {
    const summaryFields: Record<string, string> = {
      'country': '$summary.summary_content.country',
      'supplier': '$summary.summary_content.supplier',
      'classification': '$summary.summary_content.classification',
      'category': '$summary.summary_content.category',
      'currency': '$summary.summary_content.currency',
      'vat_rate': '$summary.summary_content.vat_rate',
    };
    
    const invoiceFields: Record<string, string> = {
      'date': '$created_at',
      'status': '$status',
      'source': '$source',
    };

    const lowerField = field.toLowerCase();
    return summaryFields[lowerField] || invoiceFields[lowerField] || `$${lowerField}`;
  }

  private mapYAxisFieldToJoinedPath(field: string): string {
    const summaryFields: Record<string, string> = {
      'total_amount': '$summary.summary_content.total_amount',
      'vat_amount': '$summary.summary_content.vat_amount',
      'net_amount': '$summary.summary_content.net_amount',
    };
    
    const invoiceFields: Record<string, string> = {
      'claim_amount': '$claim_amount',
      'count': '_id', // Will use $sum: 1
    };

    const lowerField = field.toLowerCase();
    return summaryFields[lowerField] || invoiceFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForJoined(yAxisDbPath: string, yAxisField: string): any {
    if (yAxisField === 'Count' || yAxisField === 'Percentage') {
      return { $sum: 1 };
    }
    
    // For numeric fields, sum the field value
    // Handle string amounts from summary_content by converting to number
    if (yAxisDbPath.includes('summary_content')) {
      return { 
        $sum: { 
          $toDouble: { 
            $ifNull: [yAxisDbPath, '0'] 
          } 
        } 
      };
    }
    
    return { $sum: { $toDouble: { $ifNull: [yAxisDbPath, 0] } } };
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

  /**
   * Check if there are new invoices created after the given date
   * Since summaries always exist with invoices and neither can change after creation,
   * we only need to check invoices. Account filtering is handled by plugins.
   * @param sinceDate - Date to check against
   * @returns true if new invoices exist, false otherwise
   */
  async hasNewDataSince(sinceDate: Date): Promise<boolean> {
    try {
      const invoiceCount = await this.invoiceModel.countDocuments({
        created_at: { $gt: sinceDate },
      }).exec();
      
      return invoiceCount > 0;
    } catch (error) {
      logger.error('Error checking for new data', 'WidgetDataService', { error, sinceDate });
      // If we can't check, assume there might be new data to be safe
      return true;
    }
  }
}

