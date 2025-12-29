import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invoice, InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { Entity, EntityDocument } from 'src/Common/Infrastructure/DB/schemas/entity.schema';
import { ReportingQueryRequest } from '../Requests/reporting.requests';
import { ReportingQueryBuilderService, UserContext } from './reporting-query-builder.service';
import { ReportingCacheService } from './reporting-cache.service';
import { UserRole } from 'src/Common/consts/userRole';
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
      user_type: UserRole;
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
    private readonly queryBuilder: ReportingQueryBuilderService,
    private readonly cacheService: ReportingCacheService,
  ) {}

  // Helper function to clean VAT amounts from European format to numeric
  private cleanVatAmount(vatAmount: any): number | null {
    if (!vatAmount) return null;
    
    const cleanAmount = String(vatAmount)
      .replace(/[€$£¥]/g, '') // Remove currency symbols only
      .trim();
    
    const parsed = parseFloat(cleanAmount);
    return isNaN(parsed) ? null : parsed;
  }

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
        .sort(sort)
        .limit(params.limit || 100)
        .skip(params.skip || 0)
        .lean()
        .exec(),
      this.invoiceModel
        .countDocuments(query)
        .exec()
    ]);

    // Enrich data with computed fields (Invoice already has all extracted fields)
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
      
      logger.info('Entity lookup result', ReportingService.name, { 
        invoice_id: invoice._id,
        entity_id: invoice.entity_id,
        entity_found: !!entity,
        entity_name: entity?.entity_name || 'Not found',
        country: invoice.country || 'Not found'
      });
      
      return {
        ...invoice,
        total_amount: this.calculateTotalAmount(invoice),
        entity_name: entity?.entity_name || (invoice.supplier ? `${invoice.supplier} (Entity)` : 'Unknown Entity'),
        vendor_name: invoice.supplier || 'Unknown',
        // Map reason field to error_message for consistency
        error_message: invoice.reason || invoice.error_message || null,
        // Invoice fields (already on invoice, but ensure they're present)
        country: invoice.country || null,
        description: invoice.description || null,
        vat_rate: invoice.vat_rate || null,
        currency: invoice.currency || null,
        net_amount: invoice.net_amount || null,
        vat_amount: this.cleanVatAmount(invoice.vat_amount) || null,
        invoice_date: invoice.invoice_date || null,
        invoice_number: invoice.invoice_id || null,
        supplier: invoice.supplier || null,
        detailed_items: invoice.detailed_items || null,
      };
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