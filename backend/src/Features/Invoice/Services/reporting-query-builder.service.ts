import { Injectable } from '@nestjs/common';
import { FilterQuery, Types } from 'mongoose';
import { ReportingQueryRequest } from '../Requests/reporting.requests';
import { InvoiceDocument } from 'src/Common/Infrastructure/DB/schemas/invoice.schema';
import { UserType } from 'src/Common/consts/userType';

export interface UserContext {
  accountId: string;
  entityId?: string;
  userType: UserType;
}

@Injectable()
export class ReportingQueryBuilderService {
  
  buildTenantQuery(user: UserContext, params: ReportingQueryRequest): FilterQuery<InvoiceDocument> {
    const query: FilterQuery<InvoiceDocument> = {};

    return this.addFilters(query, params);
  }

  buildTenantQueryWithoutEntityScope(user: UserContext, params: ReportingQueryRequest): FilterQuery<InvoiceDocument> {
    const query: FilterQuery<InvoiceDocument> = {};

    return this.addFilters(query, params);
  }

  private addFilters(query: FilterQuery<InvoiceDocument>, params: ReportingQueryRequest): FilterQuery<InvoiceDocument> {
    // Multi-select filters
    if (params.status?.length) {
      query.status = { $in: params.status };
    }

    if (params.vat_scheme?.length) {
      query.vat_scheme = { $in: params.vat_scheme };
    }

    if (params.currency?.length) {
      query.currency = { $in: params.currency };
    }

    return query;
  }

  buildSortOptions(params: ReportingQueryRequest): Record<string, 1 | -1> {
    const sortBy = params.sort_by || 'created_at';
    const sortOrder = params.sort_order === 'asc' ? 1 : -1;
    
    return { [sortBy]: sortOrder };
  }

  getProjection(): Record<string, 1> {
    // Return all available fields from invoices collection
    return {
      _id: 1,
      name: 1,
      supplier: 1,
      entity_id: 1,
      invoice_date: 1,
      invoice_number: 1,
      net_amount: 1,
      vat_amount: 1,
      currency: 1,
      status: 1,
      created_at: 1,
      confidence_score: 1,
      country: 1,
      description: 1,
      vat_rate: 1,
      claim_amount: 1,
      size: 1,
      source: 1,
      error_message: 1,
      is_invoice: 1,
      status_updated_at: 1,
      // Additional fields found in database
      source_id: 1,
      last_executed_step: 1,
      content_type: 1,
      account_id: 1,
      is_claimable: 1,
      claimable_amount: 1,
      rejected_reason: 1,
      claim_submitted_at: 1,
      claim_result_received_at: 1,
      reason: 1, // error reason field
    };
  }
} 