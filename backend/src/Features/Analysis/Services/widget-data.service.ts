import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetDataConfig } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Summary, SummaryDocument } from 'src/Common/Infrastructure/DB/schemas/summary.schema';
import { Entity, EntityDocument } from 'src/Common/Infrastructure/DB/schemas/entity.schema';
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
    @InjectModel(Entity.name) private entityModel: Model<EntityDocument>,
  ) {}

  async fetchWidgetData(widget: WidgetDocument): Promise<ChartDataPoint[]> {
    const config = widget.data_config as WidgetDataConfig;
    
    // yAxisField is required for all widgets
    if (!config.yAxisField) {
      return [];
    }
    
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
    const summaryFields = ['country', 'supplier', 'vendor_name', 'currency', 'vat_rate', 'classification', 'category', 'total_amount', 'vat_amount', 'net_amount', 'total'];
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
    if (!config.yAxisField) {
      return [];
    }

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
    const yAxisDbField = this.mapYAxisFieldToDb(config.yAxisField);
    
    // If xAxisField is missing (e.g., for metric widgets), aggregate everything into a single value
    // Otherwise, group by xAxisField
    if (config.xAxisField) {
      const xAxisDbField = this.mapXAxisFieldToDb(config.xAxisField);
      const isTextField = this.isTextFieldForGrouping(config.xAxisField);
      
      // Group by X-axis (case-insensitive for text fields), aggregate Y-axis
      // For text fields, use $toLower to normalize casing, but preserve original for label
      if (isTextField) {
        pipeline.push({
          $group: {
            _id: { $toLower: `$${xAxisDbField}` },
            originalValue: { $first: `$${xAxisDbField}` }, // Keep original casing for display
            value: this.getAggregationOperation(yAxisDbField, config.yAxisField, config.aggregation),
          },
        });
      } else {
        pipeline.push({
          $group: {
            _id: `$${xAxisDbField}`,
            value: this.getAggregationOperation(yAxisDbField, config.yAxisField, config.aggregation),
          },
        });
      }

      // Sort
      if (config.xAxisField.toLowerCase() === 'date') {
        pipeline.push({ $sort: { _id: 1 } });
      } else {
        pipeline.push({ $sort: { value: -1 } });
      }
    } else {
      // Aggregate all records into a single value (for metric widgets)
      pipeline.push({
        $group: {
          _id: null,
          value: this.getAggregationOperation(yAxisDbField, config.yAxisField),
        },
      });
    }

    try {
      const results = await this.invoiceModel.aggregate(pipeline).exec();
      
      // Filter out null/undefined dates and map to chart data points
      let chartData = results
        .filter((result: any) => {
          // For date fields, filter out null/undefined/empty values
          if (config.xAxisField?.toLowerCase() === 'date' && (!result._id || result._id === null || result._id === undefined || result._id === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          const labelValue = result.originalValue !== undefined ? result.originalValue : result._id;
          return {
            label: labelValue !== null && labelValue !== undefined ? String(labelValue) : 'Total',
            value: result.value || 0,
            _originalId: labelValue,
          };
        });
      
      // For date-based line charts, parse and sort dates chronologically
      if (config.xAxisField?.toLowerCase() === 'date') {
        chartData = this.sortAndFormatDates(chartData);
        
        // For line charts with sum aggregation, calculate cumulative sum
        if (config.aggregation?.toLowerCase() === 'sum') {
          chartData = this.calculateCumulativeSum(chartData);
        }
      }
      
      return chartData.map((point: any) => ({
        label: point.label,
        value: point.value,
      }));
    } catch (error) {
      logger.error('Error fetching invoice data for widget', 'WidgetDataService', { error, config, pipeline });
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
      'Total': 'claim_amount', // For metric widgets with yAxisField: "total"
      'total': 'claim_amount',
    };
    return mapping[field] || field.toLowerCase();
  }

  private getAggregationOperation(yAxisDbField: string, yAxisField: string, aggregation?: string): any {
    // For Count, always use $sum: 1 (case-insensitive check)
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage' || aggregation?.toLowerCase() === 'count') {
      return { $sum: 1 };
    }
    
    // Use the specified aggregation type, default to sum
    const aggType = aggregation?.toLowerCase() || 'sum';
    
    switch (aggType) {
      case 'average':
      case 'avg':
        return { $avg: { $toDouble: { $ifNull: [`$${yAxisDbField}`, 0] } } };
      case 'min':
        return { $min: { $toDouble: { $ifNull: [`$${yAxisDbField}`, 0] } } };
      case 'max':
        return { $max: { $toDouble: { $ifNull: [`$${yAxisDbField}`, 0] } } };
      case 'sum':
      default:
        return { $sum: { $toDouble: { $ifNull: [`$${yAxisDbField}`, 0] } } };
    }
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
    if (!config.yAxisField) {
      return [];
    }

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
    const yAxisDbPath = this.mapYAxisFieldToJoinedPath(config.yAxisField);

    // If xAxisField is missing (e.g., for metric widgets), aggregate everything into a single value
    // Otherwise, group by xAxisField
    if (config.xAxisField) {
      const xAxisDbPath = this.mapXAxisFieldToJoinedPath(config.xAxisField);
      const isTextField = this.isTextFieldForGrouping(config.xAxisField);
      
      // Group by X-axis (case-insensitive for text fields), aggregate Y-axis
      // For text fields, use $toLower to normalize casing, but preserve original for label
      if (isTextField) {
        pipeline.push({
          $group: {
            _id: { $toLower: xAxisDbPath },
            originalValue: { $first: xAxisDbPath }, // Keep original casing for display
            value: this.getAggregationOperationForJoined(yAxisDbPath, config.yAxisField, config.aggregation),
          },
        });
      } else {
        pipeline.push({
          $group: {
            _id: xAxisDbPath,
            value: this.getAggregationOperationForJoined(yAxisDbPath, config.yAxisField, config.aggregation),
          },
        });
      }

      // Sort
      if (config.xAxisField.toLowerCase() === 'date' || config.xAxisField.toLowerCase().includes('time')) {
        pipeline.push({ $sort: { _id: 1 } });
      } else {
        pipeline.push({ $sort: { value: -1 } });
      }
    } else {
      // Aggregate all records into a single value (for metric widgets)
      pipeline.push({
        $group: {
          _id: null,
          value: this.getAggregationOperationForJoined(yAxisDbPath, config.yAxisField, config.aggregation),
        },
      });
    }

    try {
      const results = await this.invoiceModel.aggregate(pipeline).exec();
      
      // Filter out null/undefined dates and map to chart data points
      let chartData = results
        .filter((result: any) => {
          // For date fields, filter out null/undefined/empty values
          if (config.xAxisField?.toLowerCase() === 'date' && (!result._id || result._id === null || result._id === undefined || result._id === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          const labelValue = result.originalValue !== undefined ? result.originalValue : result._id;
          return {
            label: labelValue !== null && labelValue !== undefined ? String(labelValue) : 'Total',
            value: result.value || 0,
            _originalId: labelValue,
          };
        });
      
      // For date-based line charts, parse and sort dates chronologically
      if (config.xAxisField?.toLowerCase() === 'date') {
        chartData = this.sortAndFormatDates(chartData);
        
        // For line charts with sum aggregation, calculate cumulative sum
        if (config.aggregation?.toLowerCase() === 'sum') {
          chartData = this.calculateCumulativeSum(chartData);
        }
      }
      
      return chartData.map((point: any) => ({
        label: point.label,
        value: point.value,
      }));
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
      'date': '$summary.summary_content.date', // Invoice date from summary
    };
    
    const invoiceFields: Record<string, string> = {
      'created_at': '$created_at', // Invoice creation/upload date
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
      'total': '$summary.summary_content.total_amount', // For metric widgets
    };
    
    const invoiceFields: Record<string, string> = {
      'claim_amount': '$claim_amount',
      'count': '_id', // Will use $sum: 1
    };

    const lowerField = field.toLowerCase();
    return summaryFields[lowerField] || invoiceFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForJoined(yAxisDbPath: string, yAxisField: string, aggregation?: string): any {
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage' || aggregation?.toLowerCase() === 'count') {
      return { $sum: 1 };
    }
    
    // Use the specified aggregation type, default to sum
    const aggType = aggregation?.toLowerCase() || 'sum';
    const convertToNumber = yAxisDbPath.includes('summary_content')
      ? { $toDouble: { $ifNull: [yAxisDbPath, '0'] } }
      : { $toDouble: { $ifNull: [yAxisDbPath, 0] } };
    
    switch (aggType) {
      case 'average':
      case 'avg':
        return { $avg: convertToNumber };
      case 'min':
        return { $min: convertToNumber };
      case 'max':
        return { $max: convertToNumber };
      case 'sum':
      default:
        return { $sum: convertToNumber };
    }
  }

  private async fetchSummaryData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.yAxisField) {
      return [];
    }

    const pipeline: any[] = [];

    // Match stage with filters
    const matchStage: any = {};
    if (config.filters?.dateRange) {
      matchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    if (config.filters?.country) {
      matchStage['summary_content.country'] = config.filters.country;
    }
    if (config.filters?.classification) {
      matchStage['summary_content.classification'] = config.filters.classification;
    }
    if (config.filters?.category) {
      matchStage['summary_content.category'] = config.filters.category;
    }
    if (config.filters?.is_invoice !== undefined) {
      matchStage.is_invoice = config.filters.is_invoice;
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Map fields to actual DB paths
    const yAxisDbPath = this.mapYAxisFieldToSummaryPath(config.yAxisField);

    // If xAxisField is missing (e.g., for metric widgets), aggregate everything into a single value
    // Otherwise, group by xAxisField
    if (config.xAxisField) {
      const xAxisDbPath = this.mapXAxisFieldToSummaryPath(config.xAxisField);
      const isTextField = this.isTextFieldForGrouping(config.xAxisField);
      
      // Group by X-axis (case-insensitive for text fields), aggregate Y-axis
      // For text fields, use $toLower to normalize casing, but preserve original for label
      if (isTextField) {
        pipeline.push({
          $group: {
            _id: { $toLower: xAxisDbPath },
            originalValue: { $first: xAxisDbPath }, // Keep original casing for display
            value: this.getAggregationOperationForSummary(yAxisDbPath, config.yAxisField, config.aggregation),
          },
        });
      } else {
        pipeline.push({
          $group: {
            _id: xAxisDbPath,
            value: this.getAggregationOperationForSummary(yAxisDbPath, config.yAxisField, config.aggregation),
          },
        });
      }

      // Sort
      if (config.xAxisField.toLowerCase() === 'date' || config.xAxisField.toLowerCase().includes('time')) {
        pipeline.push({ $sort: { _id: 1 } });
      } else {
        pipeline.push({ $sort: { value: -1 } });
      }
    } else {
      // Aggregate all records into a single value (for metric widgets)
      pipeline.push({
        $group: {
          _id: null,
          value: this.getAggregationOperationForSummary(yAxisDbPath, config.yAxisField, config.aggregation),
        },
      });
    }

    try {
      const results = await this.summaryModel.aggregate(pipeline).exec();
      
      // Filter out null/undefined dates and map to chart data points
      let chartData = results
        .filter((result: any) => {
          // For date fields, filter out null/undefined/empty values
          if (config.xAxisField?.toLowerCase() === 'date' && (!result._id || result._id === null || result._id === undefined || result._id === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          const labelValue = result.originalValue !== undefined ? result.originalValue : result._id;
          return {
            label: labelValue !== null && labelValue !== undefined ? String(labelValue) : 'Total',
            value: result.value || 0,
            // Store original _id for date parsing
            _originalId: labelValue,
          };
        });
      
      // For date-based line charts, parse and sort dates chronologically
      if (config.xAxisField?.toLowerCase() === 'date') {
        chartData = this.sortAndFormatDates(chartData);
        
        // For line charts with sum aggregation, calculate cumulative sum
        if (config.aggregation?.toLowerCase() === 'sum') {
          chartData = this.calculateCumulativeSum(chartData);
        }
      }
      
      return chartData.map((point: any) => ({
        label: point.label,
        value: point.value,
      }));
    } catch (error) {
      logger.error('Error fetching summary data for widget', 'WidgetDataService', { error, config });
      throw error;
    }
  }

  private mapXAxisFieldToSummaryPath(field: string): string {
    const summaryContentFields: Record<string, string> = {
      'country': '$summary_content.country',
      'supplier': '$summary_content.supplier',
      'vendor_name': '$summary_content.supplier',
      'classification': '$summary_content.classification',
      'category': '$summary_content.category',
      'currency': '$summary_content.currency',
      'vat_rate': '$summary_content.vat_rate',
      'date': '$summary_content.date',
    };
    
    const summaryFields: Record<string, string> = {
      'created_at': '$created_at',
      'is_invoice': '$is_invoice',
      'file_name': '$file_name',
    };

    const lowerField = field.toLowerCase();
    return summaryContentFields[lowerField] || summaryFields[lowerField] || `$${lowerField}`;
  }

  private mapYAxisFieldToSummaryPath(field: string): string {
    const summaryContentFields: Record<string, string> = {
      'total_amount': '$summary_content.total_amount',
      'vat_amount': '$summary_content.vat_amount',
      'net_amount': '$summary_content.net_amount',
      'total': '$summary_content.total_amount', // For metric widgets
    };
    
    const summaryFields: Record<string, string> = {
      'count': '_id',
      'processing_time': '$processing_time_seconds',
    };

    const lowerField = field.toLowerCase();
    return summaryContentFields[lowerField] || summaryFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForSummary(yAxisDbPath: string, yAxisField: string, aggregation?: string): any {
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage' || aggregation?.toLowerCase() === 'count') {
      return { $sum: 1 };
    }
    
    // Use the specified aggregation type, default to sum
    const aggType = aggregation?.toLowerCase() || 'sum';
    const convertToNumber = yAxisDbPath.includes('summary_content')
      ? { $toDouble: { $ifNull: [yAxisDbPath, '0'] } }
      : { $toDouble: { $ifNull: [yAxisDbPath, 0] } };
    
    switch (aggType) {
      case 'average':
      case 'avg':
        return { $avg: convertToNumber };
      case 'min':
        return { $min: convertToNumber };
      case 'max':
        return { $max: convertToNumber };
      case 'sum':
      default:
        return { $sum: convertToNumber };
    }
  }

  private async fetchEntityData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.xAxisField || !config.yAxisField) return [];

    const pipeline: any[] = [];

    // Match stage with filters
    const matchStage: any = {};
    if (config.filters?.dateRange) {
      matchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    if (config.filters?.status) {
      matchStage.status = config.filters.status;
    }
    if (config.filters?.entity_type) {
      matchStage.entity_type = config.filters.entity_type;
    }
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Map fields to actual DB paths
    const xAxisDbPath = this.mapXAxisFieldToEntityPath(config.xAxisField);
    const yAxisDbPath = this.mapYAxisFieldToEntityPath(config.yAxisField);

    // Group by X-axis, aggregate Y-axis
    pipeline.push({
      $group: {
        _id: xAxisDbPath,
        value: this.getAggregationOperationForEntity(yAxisDbPath, config.yAxisField),
      },
    });

    // Sort
    if (config.xAxisField.toLowerCase() === 'date' || config.xAxisField.toLowerCase().includes('time')) {
      pipeline.push({ $sort: { _id: 1 } });
    } else {
      pipeline.push({ $sort: { value: -1 } });
    }

    try {
      const results = await this.entityModel.aggregate(pipeline).exec();
      
      return results.map((result: any) => ({
        label: String(result._id || 'Unknown'),
        value: result.value || 0,
      }));
    } catch (error) {
      logger.error('Error fetching entity data for widget', 'WidgetDataService', { error, config });
      throw error;
    }
  }

  private mapXAxisFieldToEntityPath(field: string): string {
    const entityFields: Record<string, string> = {
      'name': '$name',
      'entity_type': '$entity_type',
      'status': '$status',
      'country': '$address.country',
      'city': '$address.city',
      'vat_number': '$vat_settings.vat_number',
      'currency': '$vat_settings.currency',
      'filing_frequency': '$vat_settings.filing_frequency',
      'date': '$created_at',
      'created_at': '$created_at',
    };

    const lowerField = field.toLowerCase();
    return entityFields[lowerField] || `$${lowerField}`;
  }

  private mapYAxisFieldToEntityPath(field: string): string {
    const entityFields: Record<string, string> = {
      'count': '_id',
      'vat_rate': '$vat_settings.vat_rate',
    };

    const lowerField = field.toLowerCase();
    return entityFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForEntity(yAxisDbPath: string, yAxisField: string): any {
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage') {
      return { $sum: 1 };
    }
    
    return { $sum: { $toDouble: { $ifNull: [yAxisDbPath, 0] } } };
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

  /**
   * Parse and sort dates chronologically, handling various date formats
   */
  private sortAndFormatDates(chartData: any[]): any[] {
    return chartData
      .map((point) => {
        const dateStr = point._originalId || point.label;
        const parsedDate = this.parseDate(dateStr);
        return {
          ...point,
          _parsedDate: parsedDate,
          _dateStr: dateStr,
        };
      })
      .filter((point) => point._parsedDate !== null) // Remove unparseable dates
      .sort((a, b) => {
        if (a._parsedDate && b._parsedDate) {
          return a._parsedDate.getTime() - b._parsedDate.getTime();
        }
        return 0;
      })
      .map((point) => ({
        label: point._dateStr, // Keep original format for display
        value: point.value,
        _parsedDate: point._parsedDate,
      }));
  }

  /**
   * Parse various date formats to Date object
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') {
      return null;
    }

    // Try ISO format first (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    }

    // Try DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      const fullYear = year < 100 ? 2000 + year : year;
      const date = new Date(fullYear, month, day);
      if (!isNaN(date.getTime())) return date;
    }

    // Try DD-MON-YYYY (e.g., "03-NOV-2022")
    const ddmonyyyy = dateStr.match(/^(\d{1,2})-([A-Z]{3})-(\d{4})$/i);
    if (ddmonyyyy) {
      const months: Record<string, number> = {
        'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
        'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11,
      };
      const day = parseInt(ddmonyyyy[1], 10);
      const month = months[ddmonyyyy[2].toUpperCase()];
      const year = parseInt(ddmonyyyy[3], 10);
      if (month !== undefined) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
      }
    }

    // Try YYYY/MM/DD
    const yyyymmdd = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  /**
   * Check if a field should be grouped case-insensitively (text fields like country, supplier, etc.)
   */
  private isTextFieldForGrouping(field: string): boolean {
    const textFields = ['country', 'supplier', 'vendor_name', 'classification', 'category', 'currency', 'status', 'source'];
    return textFields.some(tf => field.toLowerCase().includes(tf.toLowerCase()));
  }

  /**
   * Calculate cumulative sum for line charts (monotonically increasing)
   */
  private calculateCumulativeSum(chartData: any[]): any[] {
    let runningTotal = 0;
    return chartData.map((point) => {
      runningTotal += point.value || 0;
      return {
        ...point,
        value: runningTotal,
      };
    });
  }
}

