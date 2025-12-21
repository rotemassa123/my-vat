import { tool } from '@openai/agents';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { IInvoiceRepository, InvoiceFilters } from '../../../../Common/ApplicationCore/Services/IInvoiceRepository';

/**
 * Tool factory that creates invoice tools with injected repository
 */
export function createInvoiceTools(invoiceRepository: IInvoiceRepository) {
  const getInvoicesTool = tool({
    name: 'get_invoices',
    description: 'Query invoices with optional filters such as status, date range, source, etc. Returns a list of invoices matching the criteria. IMPORTANT: Use this tool even if no filters are specified - it will return all invoices for the account. Always use this tool when user asks about invoices.',
    parameters: z.object({
      status: z.string().nullable().optional().describe('Filter by invoice status (e.g., "processing", "completed", "failed")'),
      source: z.string().nullable().optional().describe('Filter by source (e.g., "google_drive")'),
      date_from: z.string().nullable().optional().describe('Filter invoices created from this date (ISO format: YYYY-MM-DD)'),
      date_to: z.string().nullable().optional().describe('Filter invoices created until this date (ISO format: YYYY-MM-DD)'),
      status_updated_from: z.string().nullable().optional().describe('Filter invoices with status updated from this date (ISO format: YYYY-MM-DD)'),
      status_updated_to: z.string().nullable().optional().describe('Filter invoices with status updated until this date (ISO format: YYYY-MM-DD)'),
      limit: z.number().nullable().optional().default(50).describe('Maximum number of invoices to return (default: 50, max: 100)'),
      skip: z.number().nullable().optional().default(0).describe('Number of invoices to skip for pagination'),
    }),
    async execute(input) {
      try {
        const filters: InvoiceFilters = {};
        
        if (input.status) filters.status = input.status;
        if (input.source) filters.source = input.source;
        if (input.date_from) filters.created_at_from = new Date(input.date_from);
        if (input.date_to) filters.created_at_to = new Date(input.date_to);
        if (input.status_updated_from) filters.status_updated_at_from = new Date(input.status_updated_from);
        if (input.status_updated_to) filters.status_updated_at_to = new Date(input.status_updated_to);

        const limit = Math.min(input.limit || 50, 100);
        const skip = input.skip || 0;

        const invoices = await invoiceRepository.findInvoices(filters, limit, skip);
        
        return {
          invoices: invoices.map(inv => ({
            id: inv._id,
            name: inv.name,
            status: inv.status,
            source: inv.source,
            claim_amount: inv.claim_amount,
            created_at: inv.created_at,
            status_updated_at: inv.status_updated_at,
          })),
          count: invoices.length,
          limit,
          skip,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getInvoiceByIdTool = tool({
    name: 'get_invoice_by_id',
    description: 'Get a single invoice by its ID. Returns detailed invoice information.',
    parameters: z.object({
      invoice_id: z.string().describe('The ID of the invoice to retrieve'),
    }),
    async execute(input) {
      try {
        const invoice = await invoiceRepository.findInvoiceById(input.invoice_id);
        
        if (!invoice) {
          return {
            error: true,
            message: `Invoice with ID ${input.invoice_id} not found`,
          };
        }

        return {
          id: invoice._id,
          name: invoice.name,
          status: invoice.status,
          source: invoice.source,
          claim_amount: invoice.claim_amount,
          created_at: invoice.created_at,
          status_updated_at: invoice.status_updated_at,
          reason: invoice.reason,
          claim_submitted_at: invoice.claim_submitted_at,
          claim_result_received_at: invoice.claim_result_received_at,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const countInvoicesTool = tool({
    name: 'count_invoices',
    description: 'Count invoices matching the specified filters. Useful for getting totals by status or date range. IMPORTANT: Use this tool even if no filters are specified - it will return the total count of all invoices. Always use this tool when user asks "how many invoices" or similar counting questions.',
    parameters: z.object({
      status: z.string().nullable().optional().describe('Filter by invoice status'),
      source: z.string().nullable().optional().describe('Filter by source'),
      date_from: z.string().nullable().optional().describe('Filter invoices created from this date (ISO format: YYYY-MM-DD)'),
      date_to: z.string().nullable().optional().describe('Filter invoices created until this date (ISO format: YYYY-MM-DD)'),
    }),
    async execute(input) {
      try {
        const filters: InvoiceFilters = {};
        
        if (input.status) filters.status = input.status;
        if (input.source) filters.source = input.source;
        if (input.date_from) filters.created_at_from = new Date(input.date_from);
        if (input.date_to) filters.created_at_to = new Date(input.date_to);

        const count = await invoiceRepository.countInvoices(filters);
        
        return {
          count,
          filters: input,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to count invoices: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getInvoiceStatisticsTool = tool({
    name: 'get_invoice_statistics',
    description: 'Get statistics about invoices including totals, counts by status, and claim amounts. Optionally filtered by date range.',
    parameters: z.object({
      date_from: z.string().nullable().optional().describe('Calculate statistics from this date (ISO format: YYYY-MM-DD)'),
      date_to: z.string().nullable().optional().describe('Calculate statistics until this date (ISO format: YYYY-MM-DD)'),
      status: z.string().nullable().optional().describe('Filter by invoice status before calculating statistics'),
    }),
    async execute(input) {
      try {
        const filters: InvoiceFilters = {};
        if (input.status) filters.status = input.status;
        if (input.date_from) filters.created_at_from = new Date(input.date_from);
        if (input.date_to) filters.created_at_to = new Date(input.date_to);

        // Get all invoices matching filters (we'll calculate statistics from them)
        const invoices = await invoiceRepository.findInvoices(filters, 10000, 0);
        
        const statusCounts: Record<string, number> = {};
        let totalClaimAmount = 0;
        let invoicesWithClaims = 0;

        invoices.forEach(invoice => {
          const status = invoice.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
          
          if (invoice.claim_amount) {
            totalClaimAmount += invoice.claim_amount;
            invoicesWithClaims++;
          }
        });

        return {
          total_count: invoices.length,
          status_breakdown: statusCounts,
          total_claim_amount: totalClaimAmount,
          invoices_with_claims: invoicesWithClaims,
          average_claim_amount: invoicesWithClaims > 0 ? totalClaimAmount / invoicesWithClaims : 0,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to get invoice statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getInvoiceSummariesTool = tool({
    name: 'get_invoice_summaries',
    description: 'Get invoices with their full extracted summary data including supplier, invoice date, amounts, VAT details, currency, country, and more. Use this when the user asks about invoice details, amounts, suppliers, dates, or any specific invoice information. This returns the actual extracted and processed data from invoices. IMPORTANT: Always use this tool when user asks to see, list, or show invoices - even without specific filters.',
    parameters: z.object({
      limit: z.number().nullable().optional().default(50).describe('Maximum number of invoices to return (default: 50, max: 100)'),
      skip: z.number().nullable().optional().default(0).describe('Number of invoices to skip for pagination'),
    }),
    async execute(input) {
      try {
        const limit = Math.min(input.limit || 50, 100);
        const skip = input.skip || 0;

        const result = await invoiceRepository.findCombinedInvoices({}, limit, skip);
        
        return {
          invoices: result.data.map(inv => ({
            id: inv._id,
            name: inv.name,
            status: inv.status,
            source: inv.source,
            created_at: inv.created_at,
            status_updated_at: inv.status_updated_at,
            // Summary metadata
            is_invoice: inv.is_invoice,
            success: inv.success,
            confidence_score: inv.confidence_score,
            error_message: inv.error_message,
            // Extracted invoice data
            supplier: inv.supplier,
            vendor_name: inv.vendor_name,
            invoice_date: inv.invoice_date,
            invoice_number: inv.invoice_number,
            country: inv.country,
            description: inv.description,
            net_amount: inv.net_amount,
            vat_amount: inv.vat_amount,
            vat_rate: inv.vat_rate,
            currency: inv.currency,
            total_amount: inv.total_amount,
            // Claim data
            claim_amount: inv.claim_amount,
            claim_submitted_at: inv.claim_submitted_at,
            claim_result_received_at: inv.claim_result_received_at,
            reason: inv.reason,
          })),
          total: result.total,
          count: result.count,
          limit: result.limit,
          skip: result.skip,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch invoice summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getInvoicesTool,
    getInvoiceByIdTool,
    countInvoicesTool,
    getInvoiceStatisticsTool,
    getInvoiceSummariesTool,
  };
}

