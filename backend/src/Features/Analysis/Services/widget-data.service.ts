import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WidgetDocument } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { WidgetDataConfig } from 'src/Common/Infrastructure/DB/schemas/widget.schema';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Entity, EntityDocument } from 'src/Common/Infrastructure/DB/schemas/entity.schema';
import { logger } from 'src/Common/Infrastructure/Config/Logger';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface GlobalFilters {
  entityIds?: string[];
  country?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

@Injectable()
export class WidgetDataService {
  constructor(
    @InjectModel(Invoice.name) private invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Entity.name) private entityModel: Model<EntityDocument>,
  ) {}

  async fetchWidgetData(widget: WidgetDocument, globalFilters?: GlobalFilters): Promise<ChartDataPoint[]> {
    const config = widget.data_config as WidgetDataConfig;
    
    // Merge global filters with widget's filters (global filters take precedence)
    const mergedConfig = this.mergeFilters(config, globalFilters);
    
    // Debug logging
    if (globalFilters) {
      logger.info('Applying global filters to widget', 'WidgetDataService', {
        widgetId: widget._id.toString(),
        globalFilters,
        mergedFilters: mergedConfig.filters,
      });
    }
    
    // yAxisField is required for all widgets
    if (!mergedConfig.yAxisField) {
      return [];
    }
    
    // Determine if we need data from both collections
    // Some graphs need invoice fields (status, claim_amount) AND extracted fields (country, classification, total_amount)
    const needsInvoiceFields = this.requiresInvoiceFields(mergedConfig);
    const needsExtractedFields = this.requiresExtractedFields(mergedConfig);
    
    if (needsInvoiceFields && needsExtractedFields) {
      // Need both: join invoices with extracted data
      return this.fetchJoinedData(mergedConfig);
    } else if (needsExtractedFields) {
      // Only need extracted data
      return this.fetchExtractedData(mergedConfig);
    } else {
      // Default to invoices only
      return this.fetchInvoiceData(mergedConfig);
    }
  }

  private mergeFilters(config: WidgetDataConfig, globalFilters?: GlobalFilters): WidgetDataConfig {
    if (!globalFilters) {
      return config;
    }

    const mergedConfig = { ...config };
    mergedConfig.filters = { ...config.filters };

    // Merge entityIds
    if (globalFilters.entityIds && globalFilters.entityIds.length > 0) {
      mergedConfig.filters.entityIds = globalFilters.entityIds;
    }

    // Merge country
    if (globalFilters.country) {
      mergedConfig.filters.country = globalFilters.country;
    }

    // Merge dateRange (global takes precedence)
    if (globalFilters.dateRange) {
      mergedConfig.filters.dateRange = {
        start: globalFilters.dateRange.start,
        end: globalFilters.dateRange.end,
        field: config.filters?.dateRange?.field, // Keep widget's field if specified
      };
    }

    return mergedConfig;
  }

  private requiresInvoiceFields(config: WidgetDataConfig): boolean {
    const invoiceFields = ['status', 'claim_amount', 'source', 'created_at', 'status_updated_at', 'entity_id'];
    const xField = config.xAxisField?.toLowerCase();
    const yField = config.yAxisField?.toLowerCase();
    const filterKeys = Object.keys(config.filters || {});
    
    return invoiceFields.some(field => 
      xField?.includes(field) || 
      yField?.includes(field) ||
      filterKeys.some(key => key.toLowerCase().includes(field))
    );
  }

  private requiresExtractedFields(config: WidgetDataConfig): boolean {
    const extractedFields = ['country', 'supplier', 'vendor_name', 'currency', 'vat_rate', 'classification', 'category', 'total_amount', 'vat_amount', 'net_amount', 'total'];
    const xField = config.xAxisField?.toLowerCase();
    const yField = config.yAxisField?.toLowerCase();
    const filterKeys = Object.keys(config.filters || {});
    
    return extractedFields.some(field => 
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
    
    // Apply entityIds filter
    if (config.filters?.entityIds && Array.isArray(config.filters.entityIds) && config.filters.entityIds.length > 0) {
      matchStage.entity_id = {
        $in: config.filters.entityIds.map(id => new Types.ObjectId(id)),
      };
    }
    
    // Apply dateRange filter
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
      // Disable entity scope plugin when we have entity filters (plugin conflicts with our filter)
      const options = config.filters?.entityIds && config.filters.entityIds.length > 0 
        ? { disableEntityScope: true } 
        : {};
      const results = await this.invoiceModel.aggregate(pipeline, options).exec();
      
      // Filter out null/undefined/empty values for all grouping fields
      // BUT: Allow _id: null for metric widgets (no xAxisField - aggregated into single value)
      let chartData = results
        .filter((result: any) => {
          // For metric widgets (no xAxisField), _id is intentionally null - allow it
          if (!config.xAxisField && result._id === null) {
            return true;
          }
          // Filter out null/undefined/empty _id values for widgets with xAxisField
          if (!result._id || result._id === null || result._id === undefined || result._id === '') {
            return false;
          }
          // Also filter out if originalValue is null/empty (for case-insensitive text grouping)
          if (result.originalValue !== undefined && (!result.originalValue || result.originalValue === null || result.originalValue === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          // For metric widgets, _id is null, so use 'Total' as label
          const labelValue = result.originalValue !== undefined ? result.originalValue : (result._id !== null ? result._id : 'Total');
          return {
            label: String(labelValue),
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
      'Region': 'country', // from extracted content if available
    };
    return mapping[field] || field.toLowerCase();
  }

  private mapYAxisFieldToDb(field: string): string {
    const mapping: Record<string, string> = {
      'Revenue': 'claim_amount', // or total_amount from extracted data
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
   *   { file_name: "invoice1.pdf", extracted_content: { country: "GB", total_amount: "1000.00" } }
   *   { file_name: "invoice2.pdf", extracted_content: { country: "GB", total_amount: "2000.00" } }
   *   { file_name: "invoice3.pdf", extracted_content: { country: "FR", total_amount: "1500.00" } }
   * 
   * Pipeline steps:
   * 1. $match: { status: "claimable" } -> filters to inv1, inv2
   * 2. $lookup: joins summaries -> inv1+sum1, inv2+sum2
   * 3. $unwind: flattens extracted data -> inv1+ext1, inv2+ext2
   * 4. $group: { _id: "$country", value: sum(total_amount) }
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
    
    // Apply entityIds filter
    if (config.filters?.entityIds && Array.isArray(config.filters.entityIds) && config.filters.entityIds.length > 0) {
      matchStage.entity_id = {
        $in: config.filters.entityIds.map(id => new Types.ObjectId(id)),
      };
    }
    
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
    
    // Add extracted field filters (now on Invoice directly)
    if (config.filters?.country && Array.isArray(config.filters.country) && config.filters.country.length > 0) {
      if (config.filters.country.length === 1) {
        matchStage.country = { 
          $regex: new RegExp(`^${config.filters.country[0]}$`, 'i') 
        };
      } else {
        matchStage.$or = (matchStage.$or || []).concat(
          config.filters.country.map(c => ({
            country: { $regex: new RegExp(`^${c}$`, 'i') }
          }))
        );
      }
    }
    if (config.filters?.classification) {
      matchStage.classification = config.filters.classification;
    }
    if (config.filters?.category) {
      matchStage.subclassification = config.filters.category;
    }
    
    // Only include invoices that have extracted data
    matchStage.$or = (matchStage.$or || []).concat([
      { country: { $exists: true, $ne: null } },
      { supplier: { $exists: true, $ne: null } },
      { invoice_date: { $exists: true, $ne: null } }
    ]);
    
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Map fields to Invoice paths (no join needed)
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
      // Disable entity scope plugin when we have entity filters (plugin conflicts with our filter)
      const options = config.filters?.entityIds && config.filters.entityIds.length > 0 
        ? { disableEntityScope: true } 
        : {};
      const results = await this.invoiceModel.aggregate(pipeline, options).exec();
      
      // Filter out null/undefined/empty values for all grouping fields
      // BUT: Allow _id: null for metric widgets (no xAxisField - aggregated into single value)
      let chartData = results
        .filter((result: any) => {
          // For metric widgets (no xAxisField), _id is intentionally null - allow it
          if (!config.xAxisField && result._id === null) {
            return true;
          }
          // Filter out null/undefined/empty _id values for widgets with xAxisField
          if (!result._id || result._id === null || result._id === undefined || result._id === '') {
            return false;
          }
          // Also filter out if originalValue is null/empty (for case-insensitive text grouping)
          if (result.originalValue !== undefined && (!result.originalValue || result.originalValue === null || result.originalValue === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          // For metric widgets, _id is null, so use 'Total' as label
          const labelValue = result.originalValue !== undefined ? result.originalValue : (result._id !== null ? result._id : 'Total');
          return {
            label: String(labelValue),
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
    // Map to Invoice fields directly (extracted fields are embedded in Invoice)
    const invoiceFields: Record<string, string> = {
      'country': '$country',
      'supplier': '$supplier',
      'classification': '$classification',
      'category': '$subclassification',
      'currency': '$currency',
      'vat_rate': '$vat_rate',
      'date': '$invoice_date',
      'invoice_date': '$invoice_date',
      'created_at': '$created_at',
      'status': '$status',
      'source': '$source',
      'entity_id': '$entity_id',
    };

    const lowerField = field.toLowerCase();
    return invoiceFields[lowerField] || `$${lowerField}`;
  }

  private mapYAxisFieldToJoinedPath(field: string): string {
    // Map to Invoice fields directly (extracted fields are embedded in Invoice)
    const invoiceFields: Record<string, string> = {
      'total_amount': '$total_amount',
      'vat_amount': '$vat_amount',
      'net_amount': '$net_amount',
      'total': '$total_amount', // For metric widgets
      'claim_amount': '$claim_amount',
      'count': '_id', // Will use $sum: 1
    };

    const lowerField = field.toLowerCase();
    return invoiceFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForJoined(yAxisDbPath: string, yAxisField: string, aggregation?: string): any {
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage' || aggregation?.toLowerCase() === 'count') {
      return { $sum: 1 };
    }
    
    // Use the specified aggregation type, default to sum
    const aggType = aggregation?.toLowerCase() || 'sum';
    // Convert to number for numeric fields
    const convertToNumber = ['total_amount', 'vat_amount', 'net_amount'].some(field => 
      yAxisDbPath.includes(field)
    )
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

  private async fetchExtractedData(config: WidgetDataConfig): Promise<ChartDataPoint[]> {
    if (!config.yAxisField) {
      return [];
    }

    const pipeline: any[] = [];
    const hasEntityFilter = config.filters?.entityIds && Array.isArray(config.filters.entityIds) && config.filters.entityIds.length > 0;
    let yAxisDbPath: string;

    // Always use Invoice model - invoices have all extracted fields embedded
    const invoiceMatchStage: any = {};
    
    // Filter by entity_id if provided
    if (hasEntityFilter) {
      try {
        const objectIds = config.filters.entityIds
          .filter(id => id && Types.ObjectId.isValid(id))
          .map(id => new Types.ObjectId(id));
        
        if (objectIds.length > 0) {
          invoiceMatchStage.entity_id = { $in: objectIds };
        }
      } catch (error) {
        logger.error('Error processing entity IDs in fetchExtractedData', 'WidgetDataService', { error });
      }
    }
    
    // Filter by date range (use created_at or invoice_date)
    if (config.filters?.dateRange) {
      invoiceMatchStage.created_at = {
        $gte: new Date(config.filters.dateRange.start),
        $lte: new Date(config.filters.dateRange.end),
      };
    }
    
    // Only include invoices that have extracted data
    invoiceMatchStage.$or = [
      { country: { $exists: true, $ne: null } },
      { supplier: { $exists: true, $ne: null } },
      { invoice_date: { $exists: true, $ne: null } }
    ];
    
    // Filter by country
    if (config.filters?.country && Array.isArray(config.filters.country) && config.filters.country.length > 0) {
      if (config.filters.country.length === 1) {
        invoiceMatchStage.country = { 
          $regex: new RegExp(`^${config.filters.country[0]}$`, 'i') 
        };
      } else {
        invoiceMatchStage.$or = [
          ...invoiceMatchStage.$or,
          ...config.filters.country.map(c => ({
            country: { $regex: new RegExp(`^${c}$`, 'i') }
          }))
        ];
      }
    }
    
    // Filter by classification
    if (config.filters?.classification) {
      invoiceMatchStage.classification = config.filters.classification;
    }
    
    // Filter by category (subclassification)
    if (config.filters?.category) {
      invoiceMatchStage.subclassification = config.filters.category;
    }
    
    if (Object.keys(invoiceMatchStage).length > 0) {
      pipeline.push({ $match: invoiceMatchStage });
    }
    
    // Map fields to Invoice paths (direct fields, no extracted prefix)
    yAxisDbPath = this.mapYAxisFieldToExtractedPath(config.yAxisField);

    // Now handle grouping - yAxisDbPath is already set
    // If xAxisField is missing (e.g., for metric widgets), aggregate everything into a single value
    // Otherwise, group by xAxisField
    if (config.xAxisField) {
      // Map xAxis field to Invoice paths
      const xAxisDbPath = this.mapXAxisFieldToExtractedPath(config.xAxisField);
      const isTextField = this.isTextFieldForGrouping(config.xAxisField);
      
      // Group by X-axis (case-insensitive for text fields), aggregate Y-axis
      // For text fields, use $toLower to normalize casing, but preserve original for label
      if (isTextField) {
        pipeline.push({
          $group: {
            _id: { $toLower: xAxisDbPath },
            originalValue: { $first: xAxisDbPath }, // Keep original casing for display
            value: this.getAggregationOperationForExtracted(yAxisDbPath, config.yAxisField, config.aggregation),
          },
        });
      } else {
        pipeline.push({
          $group: {
            _id: xAxisDbPath,
            value: this.getAggregationOperationForExtracted(yAxisDbPath, config.yAxisField, config.aggregation),
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
          value: this.getAggregationOperationForExtracted(yAxisDbPath, config.yAxisField, config.aggregation),
        },
      });
    }

    try {
      // Disable entity scope plugin when we have entity filters (plugin conflicts with our filter)
      const options = hasEntityFilter
        ? { disableEntityScope: true } 
        : {};
      
      logger.debug('Executing invoice aggregation pipeline', 'WidgetDataService', {
        pipeline: JSON.stringify(pipeline, null, 2),
        options,
        hasEntityFilter,
      });
      
      // Always use invoice model
      const results = await this.invoiceModel.aggregate(pipeline, options).exec();
      
      logger.debug('Extracted data aggregation results', 'WidgetDataService', {
        resultCount: results.length,
        sampleResult: results[0],
      });
      
      // Filter out null/undefined/empty values for all grouping fields
      // BUT: Allow _id: null for metric widgets (no xAxisField - aggregated into single value)
      let chartData = results
        .filter((result: any) => {
          // For metric widgets (no xAxisField), _id is intentionally null - allow it
          if (!config.xAxisField && result._id === null) {
            return true;
          }
          // Filter out null/undefined/empty _id values for widgets with xAxisField
          if (!result._id || result._id === null || result._id === undefined || result._id === '') {
            return false;
          }
          // Also filter out if originalValue is null/empty (for case-insensitive text grouping)
          if (result.originalValue !== undefined && (!result.originalValue || result.originalValue === null || result.originalValue === '')) {
            return false;
          }
          return true;
        })
        .map((result: any) => {
          // Use originalValue if available (for case-insensitive text grouping), otherwise use _id
          // For metric widgets, _id is null, so use 'Total' as label
          const labelValue = result.originalValue !== undefined ? result.originalValue : (result._id !== null ? result._id : 'Total');
          return {
            label: String(labelValue),
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
      logger.error('Error fetching extracted data for widget', 'WidgetDataService', { error, config });
      throw error;
    }
  }

  private mapXAxisFieldToExtractedPath(field: string): string {
    // Map to Invoice fields directly
    const invoiceFields: Record<string, string> = {
      'country': '$country',
      'supplier': '$supplier',
      'vendor_name': '$supplier',
      'classification': '$classification',
      'category': '$subclassification',
      'currency': '$currency',
      'vat_rate': '$vat_rate',
      'date': '$invoice_date',
      'invoice_date': '$invoice_date',
      'created_at': '$created_at',
      'file_name': '$name',
      'entity_id': '$entity_id',
    };

    const lowerField = field.toLowerCase();
    return invoiceFields[lowerField] || `$${lowerField}`;
  }

  private mapYAxisFieldToExtractedPath(field: string): string {
    // Map to Invoice fields directly
    const invoiceFields: Record<string, string> = {
      'total_amount': '$total_amount',
      'vat_amount': '$vat_amount',
      'net_amount': '$net_amount',
      'total': '$total_amount', // For metric widgets
      'count': '_id',
    };

    const lowerField = field.toLowerCase();
    return invoiceFields[lowerField] || `$${lowerField}`;
  }

  private getAggregationOperationForExtracted(yAxisDbPath: string, yAxisField: string, aggregation?: string): any {
    const lowerYAxisField = yAxisField?.toLowerCase();
    if (lowerYAxisField === 'count' || lowerYAxisField === 'percentage' || aggregation?.toLowerCase() === 'count') {
      return { $sum: 1 };
    }
    
    // Use the specified aggregation type, default to sum
    const aggType = aggregation?.toLowerCase() || 'sum';
    // Convert to number for numeric fields (total_amount, vat_amount, net_amount)
    const convertToNumber = ['total_amount', 'vat_amount', 'net_amount'].some(field => 
      yAxisDbPath.includes(field)
    )
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

