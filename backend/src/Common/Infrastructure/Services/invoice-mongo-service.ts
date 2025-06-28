import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, FilterQuery } from "mongoose";

// Repository interface
import { 
  IInvoiceRepository, 
  InvoiceData,
  InvoiceFilters,
  SummaryData,
  SummaryFilters
} from "src/Common/ApplicationCore/Services/IInvoiceRepository";

// MongoDB schemas
import { Invoice, InvoiceDocument } from "src/Common/Infrastructure/DB/schemas/invoice.schema";
import { Summary, SummaryDocument } from "src/Common/Infrastructure/DB/schemas/summary.schema";

@Injectable()
export class InvoiceMongoService implements IInvoiceRepository {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Summary.name)
    private readonly summaryModel: Model<SummaryDocument>
  ) {}

  // ==================== INVOICE METHODS ====================

  private mapDocumentToInvoiceData(doc: InvoiceDocument): InvoiceData {
    return {
      _id: doc._id.toString(),
      account_id: doc.account_id,
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

    if (filters.account_id !== undefined) {
      query.account_id = filters.account_id;
    }
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

  // ==================== SUMMARY METHODS ====================

  private mapDocumentToSummaryData(doc: SummaryDocument): SummaryData {
    return {
      _id: doc._id.toString(),
      account_id: doc.account_id,
      file_id: doc.file_id,
      is_invoice: doc.is_invoice,
      created_at: doc.created_at,
      analysis_result: doc.analysis_result,
      extracted_data: doc.extracted_data,
      confidence_score: doc.confidence_score,
      processing_status: doc.processing_status,
      vat_amount: doc.vat_amount,
      total_amount: doc.total_amount,
      currency: doc.currency,
      vendor_name: doc.vendor_name,
      invoice_date: doc.invoice_date,
      invoice_number: doc.invoice_number,
    };
  }

  private buildSummaryQuery(filters: SummaryFilters): FilterQuery<SummaryDocument> {
    const query: FilterQuery<SummaryDocument> = {};

    if (filters.account_id !== undefined) {
      query.account_id = filters.account_id;
    }
    if (filters.file_id) {
      query.file_id = filters.file_id;
    }
    if (filters.is_invoice !== undefined) {
      query.is_invoice = filters.is_invoice;
    }
    if (filters.processing_status) {
      query.processing_status = filters.processing_status;
    }
    if (filters.currency) {
      query.currency = filters.currency;
    }
    if (filters.vendor_name_contains) {
      query.vendor_name = { $regex: filters.vendor_name_contains, $options: 'i' };
    }
    if (filters.confidence_score_min !== undefined || filters.confidence_score_max !== undefined) {
      query.confidence_score = {};
      if (filters.confidence_score_min !== undefined) {
        query.confidence_score.$gte = filters.confidence_score_min;
      }
      if (filters.confidence_score_max !== undefined) {
        query.confidence_score.$lte = filters.confidence_score_max;
      }
    }
    if (filters.vat_amount_min !== undefined || filters.vat_amount_max !== undefined) {
      query.vat_amount = {};
      if (filters.vat_amount_min !== undefined) {
        query.vat_amount.$gte = filters.vat_amount_min;
      }
      if (filters.vat_amount_max !== undefined) {
        query.vat_amount.$lte = filters.vat_amount_max;
      }
    }
    if (filters.total_amount_min !== undefined || filters.total_amount_max !== undefined) {
      query.total_amount = {};
      if (filters.total_amount_min !== undefined) {
        query.total_amount.$gte = filters.total_amount_min;
      }
      if (filters.total_amount_max !== undefined) {
        query.total_amount.$lte = filters.total_amount_max;
      }
    }
    if (filters.invoice_date_from || filters.invoice_date_to) {
      query.invoice_date = {};
      if (filters.invoice_date_from) {
        query.invoice_date.$gte = filters.invoice_date_from;
      }
      if (filters.invoice_date_to) {
        query.invoice_date.$lte = filters.invoice_date_to;
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

    return query;
  }

  async findSummaries(filters: SummaryFilters, limit = 50, skip = 0): Promise<SummaryData[]> {
    const query = this.buildSummaryQuery(filters);
    const docs = await this.summaryModel
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
    
    return docs.map(doc => this.mapDocumentToSummaryData(doc));
  }

  async findSummaryById(id: string): Promise<SummaryData | null> {
    const doc = await this.summaryModel.findById(id).exec();
    return doc ? this.mapDocumentToSummaryData(doc) : null;
  }

  async findSummaryByFileId(fileId: string): Promise<SummaryData | null> {
    const doc = await this.summaryModel.findOne({ file_id: fileId }).exec();
    return doc ? this.mapDocumentToSummaryData(doc) : null;
  }

  async countSummaries(filters: SummaryFilters): Promise<number> {
    const query = this.buildSummaryQuery(filters);
    return await this.summaryModel.countDocuments(query).exec();
  }
} 