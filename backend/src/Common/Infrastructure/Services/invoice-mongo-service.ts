import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery, Types } from "mongoose";
import mongoose from "mongoose";
import * as httpContext from 'express-http-context';
import { UserContext } from "../types/user-context.type";
import { logger } from "../Config/Logger";

// Repository interface
import { 
  IInvoiceRepository, 
  InvoiceData,
  InvoiceFilters,
  InvoiceExtractedData,
  InvoiceExtractedDataFilters,
  CombinedInvoiceData,
  CombinedInvoiceFilters,
  PaginatedCombinedResult
} from "src/Common/ApplicationCore/Services/IInvoiceRepository";

// MongoDB schemas
import { Invoice, InvoiceDocument } from "src/Common/Infrastructure/DB/schemas/invoice.schema";

@Injectable()
export class InvoiceMongoService implements IInvoiceRepository {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>
  ) {}

  // ==================== INVOICE METHODS ====================

  private mapDocumentToInvoiceData(doc: InvoiceDocument): InvoiceData {
    return {
      _id: doc._id.toString(),
      account_id: doc.account_id,
      entity_id: doc.entity_id,
      name: doc.name,
      source_id: doc.source_id,
      size: doc.size,
      last_executed_step: doc.last_executed_step,
      source: doc.source,
      content_type: doc.content_type,
      status: doc.status,
      reason: doc.reason,
      claim_amount: doc.claim_amount,
      claim_submitted_at: doc.claim_submitted_at,
      claim_result_received_at: doc.claim_result_received_at,
      status_updated_at: doc.status_updated_at,
      created_at: doc.created_at,
    };
  }

  private buildInvoiceQuery(filters: InvoiceFilters): FilterQuery<InvoiceDocument> {
    const query: FilterQuery<InvoiceDocument> = {};

    if (filters.source_id) {
      query.source_id = filters.source_id;
    }
    if (filters.source) {
      query.source = filters.source;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.content_type) {
      query.content_type = filters.content_type;
    }
    if (filters.last_executed_step !== undefined) {
      query.last_executed_step = filters.last_executed_step;
    }
    if (filters.name_contains) {
      query.name = { $regex: filters.name_contains, $options: 'i' };
    }
    if (filters.size_min !== undefined || filters.size_max !== undefined) {
      query.size = {};
      if (filters.size_min !== undefined) {
        query.size.$gte = filters.size_min;
      }
      if (filters.size_max !== undefined) {
        query.size.$lte = filters.size_max;
      }
    }
    if (filters.created_at_from || filters.created_at_to) {
      query.created_at = {};
      if (filters.created_at_from) {
        query.created_at.$gte = filters.created_at_from;
      }
      if (filters.created_at_to) {
        query.created_at.$lte = filters.created_at_to;
      }
    }
    if (filters.status_updated_at_from || filters.status_updated_at_to) {
      query.status_updated_at = {};
      if (filters.status_updated_at_from) {
        query.status_updated_at.$gte = filters.status_updated_at_from;
      }
      if (filters.status_updated_at_to) {
        query.status_updated_at.$lte = filters.status_updated_at_to;
      }
    }

    return query;
  }

  async findInvoices(filters: InvoiceFilters, limit = 50, skip = 0): Promise<InvoiceData[]> {
    const query = this.buildInvoiceQuery(filters);
    const docs = await this.invoiceModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    
    return docs.map(doc => this.mapDocumentToInvoiceData(doc));
  }

  async findInvoiceById(id: string): Promise<InvoiceData | null> {
    const doc = await this.invoiceModel.findById(id).exec();
    return doc ? this.mapDocumentToInvoiceData(doc) : null;
  }

  async countInvoices(filters: InvoiceFilters): Promise<number> {
    const query = this.buildInvoiceQuery(filters);
    return await this.invoiceModel.countDocuments(query).exec();
  }

  // ==================== EXTRACTED DATA METHODS ====================

  private mapDocumentToExtractedData(doc: InvoiceDocument): InvoiceExtractedData {
    // Build extracted_content from Invoice fields
    const extractedContent: any = {};
    if (doc.country) extractedContent.country = doc.country;
    if (doc.supplier) extractedContent.supplier = doc.supplier;
    if (doc.invoice_date) extractedContent.date = doc.invoice_date;
    if (doc.invoice_id) {
      extractedContent.invoice_id = doc.invoice_id;
      extractedContent.id = doc.invoice_id;
    }
    if (doc.description) extractedContent.description = doc.description;
    if (doc.net_amount !== null && doc.net_amount !== undefined) extractedContent.net_amount = String(doc.net_amount);
    if (doc.vat_amount !== null && doc.vat_amount !== undefined) extractedContent.vat_amount = String(doc.vat_amount);
    if (doc.vat_rate !== null && doc.vat_rate !== undefined) extractedContent.vat_rate = String(doc.vat_rate);
    if (doc.currency) extractedContent.currency = doc.currency;
    if (doc.detailed_items) extractedContent.detailed_items = doc.detailed_items;
    
    return {
      _id: doc._id.toString(),
      account_id: doc.account_id.toString(),
      file_id: doc._id.toString(), // Invoice _id is the file_id
      file_name: doc.name,
      is_invoice: !!(doc.country || doc.supplier || doc.invoice_date), // Consider it an invoice if it has extracted data
      extracted_content: extractedContent,
      processing_time_seconds: undefined,
      success: true, // If invoice has extracted data, processing was successful
      error_message: null,
      created_at: doc.created_at,
      extracted_data: undefined,
      confidence_score: undefined,
      processing_status: undefined,
      vat_amount: doc.vat_amount || undefined,
      total_amount: doc.total_amount || undefined,
      currency: doc.currency || undefined,
      vendor_name: doc.supplier || undefined,
      invoice_date: doc.invoice_date ? new Date(doc.invoice_date) : undefined,
      invoice_number: doc.invoice_id || undefined,
    };
  }

  private buildExtractedDataQuery(filters: InvoiceExtractedDataFilters): FilterQuery<InvoiceDocument> {
    const query: FilterQuery<InvoiceDocument> = {};

    // Filter by invoice _id (file_id maps to _id in Invoice)
    if (filters.file_id) {
      try {
        query._id = new Types.ObjectId(filters.file_id);
      } catch (e) {
        // Invalid ObjectId, skip this filter
        logger.warn(`Invalid file_id in filter: ${filters.file_id}`);
      }
    }
    
    // Filter by currency (now on Invoice)
    if (filters.currency) {
      query.currency = filters.currency;
    }
    
    // Filter by supplier (vendor_name_contains maps to supplier)
    if (filters.vendor_name_contains) {
      query.supplier = { $regex: filters.vendor_name_contains, $options: 'i' };
    }
    
    // Filter by vat_amount (now on Invoice)
    if (filters.vat_amount_min !== undefined || filters.vat_amount_max !== undefined) {
      query.vat_amount = {};
      if (filters.vat_amount_min !== undefined) {
        query.vat_amount.$gte = filters.vat_amount_min;
      }
      if (filters.vat_amount_max !== undefined) {
        query.vat_amount.$lte = filters.vat_amount_max;
      }
    }
    
    // Filter by total_amount (now on Invoice)
    if (filters.total_amount_min !== undefined || filters.total_amount_max !== undefined) {
      query.total_amount = {};
      if (filters.total_amount_min !== undefined) {
        query.total_amount.$gte = filters.total_amount_min;
      }
      if (filters.total_amount_max !== undefined) {
        query.total_amount.$lte = filters.total_amount_max;
      }
    }
    
    // Filter by invoice_date (now on Invoice)
    if (filters.invoice_date_from || filters.invoice_date_to) {
      query.invoice_date = {};
      if (filters.invoice_date_from) {
        query.invoice_date.$gte = filters.invoice_date_from;
      }
      if (filters.invoice_date_to) {
        query.invoice_date.$lte = filters.invoice_date_to;
      }
    }
    
    // Filter by created_at
    if (filters.created_at_from || filters.created_at_to) {
      query.created_at = {};
      if (filters.created_at_from) {
        query.created_at.$gte = filters.created_at_from;
      }
      if (filters.created_at_to) {
        query.created_at.$lte = filters.created_at_to;
      }
    }
    
    // Only include invoices that have extracted data (at least one extracted field populated)
    query.$or = [
      { country: { $exists: true, $ne: null } },
      { supplier: { $exists: true, $ne: null } },
      { invoice_date: { $exists: true, $ne: null } }
    ];

    return query;
  }

  async findInvoicesWithExtraction(filters: InvoiceExtractedDataFilters, limit = 50, skip = 0): Promise<InvoiceExtractedData[]> {
    const query = this.buildExtractedDataQuery(filters);
    const docs = await this.invoiceModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    
    return docs.map(doc => this.mapDocumentToExtractedData(doc));
  }

  async findInvoiceExtractionById(id: string): Promise<InvoiceExtractedData | null> {
    const doc = await this.invoiceModel.findById(id).exec();
    return doc ? this.mapDocumentToExtractedData(doc) : null;
  }

  async findInvoiceExtractionByFileId(fileId: string): Promise<InvoiceExtractedData | null> {
    // file_id maps to _id in Invoice
    try {
      const invoiceId = new Types.ObjectId(fileId);
      const doc = await this.invoiceModel.findById(invoiceId).exec();
      return doc ? this.mapDocumentToExtractedData(doc) : null;
    } catch (e) {
      logger.warn(`Invalid file_id format: ${fileId}`);
      return null;
    }
  }

  async countInvoicesWithExtraction(filters: InvoiceExtractedDataFilters): Promise<number> {
    const query = this.buildExtractedDataQuery(filters);
    return await this.invoiceModel.countDocuments(query).exec();
  }

  async findCombinedInvoices(
    filters: CombinedInvoiceFilters, 
    limit?: number, 
    skip?: number
  ): Promise<PaginatedCombinedResult> {
    // Get account_id from httpContext (AccountScopePlugin should handle this, but we'll ensure it)
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    const accountId = userContext?.accountId || filters.account_id;
    
    if (!accountId) {
      logger.warn("No account_id found in context or filters", InvoiceMongoService.name);
      return {
        data: [],
        total: 0,
        limit: limit || 0,
        skip: skip || 0,
        count: 0
      };
    }
    
    logger.info("Finding combined invoices", InvoiceMongoService.name, { 
      accountId, 
      limit, 
      skip,
      hasFilters: !!filters.account_id
    });
    
    // Explicitly add account_id match at the start (AccountScopePlugin should do this, but ensure it)
    // Only include invoices that have extracted data
    const pipeline: any[] = [
      {
        $match: {
          account_id: new mongoose.Types.ObjectId(accountId),
          $or: [
            { country: { $exists: true, $ne: null } },
            { supplier: { $exists: true, $ne: null } },
            { invoice_date: { $exists: true, $ne: null } }
          ]
        }
      },
      {
        $addFields: {
          // Map Invoice fields to match CombinedInvoiceData structure
          is_invoice: { $cond: [{ $or: [{ $ne: ['$country', null] }, { $ne: ['$supplier', null] }] }, true, false] },
          invoice_number: '$invoice_id',
          vendor_name: '$supplier'
        }
      }
    ];
    
    // Count total (without limit/skip)
    const countPipeline = [
      ...pipeline,
      { $count: "total" }
    ];
    const countResult = await this.invoiceModel.aggregate(countPipeline, { 
      maxTimeMS: 60000, 
      allowDiskUse: true 
    }).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;
    
    // Data pipeline - apply sorting and optional pagination
    const dataPipeline = [
      ...pipeline,
      { $sort: { created_at: -1 } }
    ];
    
    // Only add skip/limit if provided
    if (skip !== undefined && skip > 0) {
      dataPipeline.push({ $skip: skip });
    }
    if (limit !== undefined && limit > 0) {
      dataPipeline.push({ $limit: limit });
    }
    
    const docs = await this.invoiceModel.aggregate(dataPipeline, { 
      maxTimeMS: 60000, 
      allowDiskUse: true 
    }).exec();
    
    const data = docs.map(doc => this.mapAggregationResult(doc));
    
    return {
      data,
      total,
      limit: limit || total,
      skip: skip || 0,
      count: data.length
    };
  }
  
  private mapAggregationResult(doc: any): CombinedInvoiceData {
    return {
      _id: doc._id?.toString() || '',
      account_id: doc.account_id,
      entity_id: doc.entity_id,
      name: doc.name || '',
      source_id: doc.source_id || '',
      size: doc.size || 0,
      last_executed_step: doc.last_executed_step || 0,
      source: doc.source || '',
      content_type: doc.content_type || '',
      status: doc.status || '',
      reason: doc.reason,
      claim_amount: doc.claim_amount,
      claim_submitted_at: doc.claim_submitted_at,
      claim_result_received_at: doc.claim_result_received_at,
      status_updated_at: doc.status_updated_at,
      created_at: doc.created_at,
      is_invoice: doc.is_invoice,
      processing_time_seconds: doc.openai_processing_time_seconds,
      success: doc.success !== false, // Default to true if not explicitly false
      error_message: doc.error_message || doc.reason,
      confidence_score: doc.confidence_score,
      country: doc.country,
      supplier: doc.supplier,
      invoice_date: doc.invoice_date,
      invoice_number: doc.invoice_number || doc.invoice_id,
      description: doc.description,
      net_amount: doc.net_amount ? String(doc.net_amount) : undefined,
      vat_amount: doc.vat_amount ? String(doc.vat_amount) : undefined,
      vat_rate: doc.vat_rate ? String(doc.vat_rate) : undefined,
      currency: doc.currency,
      detailed_items: doc.detailed_items,
      vendor_name: doc.vendor_name || doc.supplier,
      total_amount: doc.total_amount,
    };
  }
} 