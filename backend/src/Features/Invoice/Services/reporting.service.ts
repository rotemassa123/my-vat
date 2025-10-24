import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Entity, EntityDocument } from 'src/Common/Infrastructure/DB/schemas/entity.schema';
import { Summary, SummaryDocument } from 'src/Common/Infrastructure/DB/schemas/summary.schema';
import { ReportingQueryRequest } from '../Requests/reporting.requests';
import { ReportingQueryBuilderService, UserContext } from './reporting-query-builder.service';
import { ReportingCacheService } from './reporting-cache.service';
import { UserType } from 'src/Common/consts/userType';
import { logger } from 'src/Common/Infrastructure/Config/Logger';

export interface ReportingResult {
  data: Record<string, unknown>[];
  metadata: {
    total: number;
    limit: number;
    skip: number;
    count: number;
    user_scope: {
      account_id: string;
      entity_id?: string;
      user_type: UserType;
    };
    cache_hit: boolean;
  };
}

@Injectable()
export class ReportingService {
  constructor(
    @InjectModel(Invoice.name)
    private readonly invoiceModel: Model<InvoiceDocument>,
    @InjectModel(Entity.name)
    private readonly entityModel: Model<EntityDocument>,
    @InjectModel(Summary.name)
    private readonly summaryModel: Model<SummaryDocument>,
    private readonly queryBuilder: ReportingQueryBuilderService,
    private readonly cacheService: ReportingCacheService,
  ) {}

  async getReportingData(user: UserContext, params: ReportingQueryRequest): Promise<ReportingResult> {
    const startTime = Date.now();
    
    // Generate cache key
    const cacheKey = this.cacheService.generateCacheKey(user, params);
    
    // Try cache first
    const cached = this.cacheService.get(cacheKey) as ReportingResult | null;
    if (cached) {
      logger.info('Reporting cache hit', ReportingService.name, { 
        cacheKey, 
        duration: Date.now() - startTime 
      });
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cache_hit: true,
        }
      };
    }

    // Cache miss - query database
    logger.info('Reporting cache miss - querying database', ReportingService.name, { cacheKey });

    const query = this.queryBuilder.buildTenantQueryWithoutEntityScope(user, params);
    const sort = this.queryBuilder.buildSortOptions(params);
    const projection = this.queryBuilder.getProjection();

    // Execute optimized queries in parallel
    const [invoices, total] = await Promise.all([
      this.invoiceModel
        .find(query, projection)
        .setOptions({ disableEntityScope: true }) // Disable entity scope for reporting
        .sort(sort)
        .limit(params.limit || 100)
        .skip(params.skip || 0)
        .lean() // Critical for performance
        .exec(),
      this.invoiceModel
        .countDocuments(query)
        .setOptions({ disableEntityScope: true }) // Disable entity scope for reporting
        .exec()
    ]);

    // Enrich data with computed fields and optionally summary data
    const enrichedInvoices = await Promise.all(invoices.map(async (invoice: Record<string, unknown>) => {
      logger.info('Processing invoice for entity lookup', ReportingService.name, { 
        invoice_id: invoice._id,
        entity_id: invoice.entity_id,
        has_entity_id: !!invoice.entity_id
      });
      
      let entity = null;
      if (invoice.entity_id) {
        entity = await this.entityModel.findById(invoice.entity_id).lean();
      }
      
      // Get summary data only if include_summary is true
      let summary = null;
      if (invoice.name) {
        summary = await this.summaryModel.findOne({ file_name: invoice.name }).lean();
      }
      
      logger.info('Entity lookup result', ReportingService.name, { 
        invoice_id: invoice._id,
        entity_id: invoice.entity_id,
        entity_found: !!entity,
        entity_name: entity?.name || 'Not found',
        summary_found: !!summary,
        country: summary?.summary_content?.country || 'Not found'
      });
      
      const baseInvoice = {
        ...invoice,
        total_amount: this.calculateTotalAmount(invoice),
        entity_name: entity?.name || (invoice.supplier ? `${invoice.supplier} (Entity)` : 'Unknown Entity'),
        vendor_name: invoice.supplier || 'Unknown',
        // Map reason field to error_message for consistency
        error_message: invoice.reason || invoice.error_message || null,
      };

      // Add summary data if requested
      if (summary) {
        return {
          ...baseInvoice,
          // Summary content fields
          country: summary.summary_content?.country || null,
          description: summary.summary_content?.description || invoice.description || null,
          vat_rate: summary.summary_content?.vat_rate || invoice.vat_rate || null,
          currency: summary.summary_content?.currency || invoice.currency || null,
          net_amount: summary.summary_content?.net_amount || invoice.net_amount || null,
          vat_amount: summary.summary_content?.vat_amount || invoice.vat_amount || null,
          total_amount: summary.summary_content?.total_amount || this.calculateTotalAmount(invoice),
          invoice_date: summary.summary_content?.date || invoice.invoice_date || null,
          invoice_number: summary.summary_content?.invoice_id || invoice.invoice_number || null,
          supplier: summary.summary_content?.supplier || invoice.supplier || null,
          detailed_items: summary.summary_content?.detailed_items || null,
          // Full summary content object
          summary_content: summary.summary_content || null,
        };
      }

      return baseInvoice;
    }));

    const result: ReportingResult = {
      data: enrichedInvoices,
      metadata: {
        total,
        limit: params.limit || 100,
        skip: params.skip || 0,
        count: enrichedInvoices.length,
        user_scope: {
          account_id: user.accountId,
          entity_id: user.entityId,
          user_type: user.userType,
        },
        cache_hit: false,
      }
    };

    // Cache the result
    this.cacheService.set(cacheKey, result, user);

    const duration = Date.now() - startTime;
    logger.info('Reporting query completed', ReportingService.name, { 
      total, 
      count: enrichedInvoices.length, 
      duration,
      cacheKey 
    });

    return result;
  }

  async invalidateCache(accountId: string, entityId?: string): Promise<void> {
    this.cacheService.invalidateUserCache(accountId, entityId);
    logger.info('Reporting cache invalidated', ReportingService.name, { accountId, entityId });
  }



  private calculateTotalAmount(invoice: Record<string, unknown>): number {
    const netAmount = parseFloat(String(invoice.net_amount)) || 0;
    const vatAmount = parseFloat(String(invoice.vat_amount)) || 0;
    return netAmount + vatAmount;
  }
} 