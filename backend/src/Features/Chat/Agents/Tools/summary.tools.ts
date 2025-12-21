import { tool } from '@openai/agents';
import { z } from 'zod';
import { IInvoiceRepository, SummaryFilters } from '../../../../Common/ApplicationCore/Services/IInvoiceRepository';

/**
 * Tool factory that creates summary tools with injected repository
 */
export function createSummaryTools(invoiceRepository: IInvoiceRepository) {
  const getSummariesTool = tool({
    name: 'get_summaries',
    description: 'Retrieves a list of document summaries (extracted data from processed files like invoices). Use this when the user asks about processed documents, their extracted data, or document analysis results. Each summary contains extracted fields like supplier name, invoice date, amounts, VAT details, and confidence scores.',
    parameters: z.object({
      file_id: z.string().nullable().optional().describe('Filter summaries by file ID'),
      is_invoice: z.boolean().nullable().optional().describe('Filter summaries by invoice type (true for invoices, false for other documents)'),
      success: z.boolean().nullable().optional().describe('Filter summaries by processing success status'),
      date_from: z.string().nullable().optional().describe('Filter summaries created after this date (ISO 8601 format, e.g., "2023-01-01")'),
      date_to: z.string().nullable().optional().describe('Filter summaries created before this date (ISO 8601 format, e.g., "2023-12-31")'),
      limit: z.number().nullable().optional().default(10).describe('Maximum number of summaries to return'),
      skip: z.number().nullable().optional().default(0).describe('Number of summaries to skip (for pagination)'),
    }),
    async execute(input) {
      const { file_id, is_invoice, success, date_from, date_to, limit, skip } = input;
      try {
        const filters: SummaryFilters = {};
        if (file_id) filters.file_id = file_id;
        if (is_invoice !== null && is_invoice !== undefined) filters.is_invoice = is_invoice;
        // Note: success filter is not available in SummaryFilters, filtering by processing_status instead
        if (date_from) filters.created_at_from = new Date(date_from);
        if (date_to) filters.created_at_to = new Date(date_to);

        const summaries = await invoiceRepository.findSummaries(filters, limit, skip);
        
        return {
          summaries: summaries.map(summary => ({
            id: summary._id,
            file_id: summary.file_id,
            file_name: summary.file_name,
            is_invoice: summary.is_invoice,
            success: summary.success,
            created_at: summary.created_at,
            confidence_score: summary.confidence_score,
            processing_status: summary.processing_status,
            error_message: summary.error_message,
            // Summary content fields
            country: summary.summary_content?.country,
            supplier: summary.summary_content?.supplier,
            date: summary.summary_content?.date,
            summary_id: summary.summary_content?.id, // Renamed to avoid conflict with top-level id
            description: summary.summary_content?.description,
            net_amount: summary.summary_content?.net_amount,
            vat_amount: summary.summary_content?.vat_amount,
            vat_rate: summary.summary_content?.vat_rate,
            currency: summary.summary_content?.currency,
            // Additional extracted fields
            total_amount: summary.total_amount,
            vendor_name: summary.vendor_name,
            invoice_date_extracted: summary.invoice_date,
          })),
          count: summaries.length,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getSummaryByIdTool = tool({
    name: 'get_summary_by_id',
    description: 'Get a single document summary by its ID. Returns detailed extracted data including all fields from the summary content.',
    parameters: z.object({
      summary_id: z.string().describe('The ID of the summary to retrieve'),
    }),
    async execute(input) {
      const { summary_id } = input;
      try {
        const summary = await invoiceRepository.findSummaryById(summary_id);
        
        if (!summary) {
          return {
            error: true,
            message: `Summary with ID ${summary_id} not found`,
          };
        }

        return {
          id: summary._id,
          file_id: summary.file_id,
          file_name: summary.file_name,
          is_invoice: summary.is_invoice,
          success: summary.success,
          created_at: summary.created_at,
          processing_time_seconds: summary.processing_time_seconds,
          confidence_score: summary.confidence_score,
          processing_status: summary.processing_status,
          error_message: summary.error_message,
          // Summary content fields
          summary_content: summary.summary_content ? {
            country: summary.summary_content.country,
            supplier: summary.summary_content.supplier,
            date: summary.summary_content.date,
            id: summary.summary_content.id,
            description: summary.summary_content.description,
            net_amount: summary.summary_content.net_amount,
            vat_amount: summary.summary_content.vat_amount,
            vat_rate: summary.summary_content.vat_rate,
            currency: summary.summary_content.currency,
          } : null,
          // Additional extracted fields
          total_amount: summary.total_amount,
          vendor_name: summary.vendor_name,
          invoice_date_extracted: summary.invoice_date,
          invoice_number_extracted: summary.invoice_number,
          analysis_result: summary.analysis_result,
          extracted_data: summary.extracted_data,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getSummaryByFileIdTool = tool({
    name: 'get_summary_by_file_id',
    description: 'Get a document summary by its file ID. Useful when you know the file ID and need to retrieve the extracted summary data for that specific file.',
    parameters: z.object({
      file_id: z.string().describe('The file ID of the summary to retrieve'),
    }),
    async execute(input) {
      const { file_id } = input;
      try {
        const summary = await invoiceRepository.findSummaryByFileId(file_id);
        
        if (!summary) {
          return {
            error: true,
            message: `Summary with file ID ${file_id} not found`,
          };
        }

        return {
          id: summary._id,
          file_id: summary.file_id,
          file_name: summary.file_name,
          is_invoice: summary.is_invoice,
          success: summary.success,
          created_at: summary.created_at,
          processing_time_seconds: summary.processing_time_seconds,
          confidence_score: summary.confidence_score,
          processing_status: summary.processing_status,
          error_message: summary.error_message,
          // Summary content fields
          summary_content: summary.summary_content ? {
            country: summary.summary_content.country,
            supplier: summary.summary_content.supplier,
            date: summary.summary_content.date,
            id: summary.summary_content.id,
            description: summary.summary_content.description,
            net_amount: summary.summary_content.net_amount,
            vat_amount: summary.summary_content.vat_amount,
            vat_rate: summary.summary_content.vat_rate,
            currency: summary.summary_content.currency,
          } : null,
          // Additional extracted fields
          total_amount: summary.total_amount,
          vendor_name: summary.vendor_name,
          invoice_date_extracted: summary.invoice_date,
          invoice_number_extracted: summary.invoice_number,
          analysis_result: summary.analysis_result,
          extracted_data: summary.extracted_data,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const countSummariesTool = tool({
    name: 'count_summaries',
    description: 'Count the total number of document summaries matching the given filters. Useful for getting quick counts of processed documents.',
    parameters: z.object({
      is_invoice: z.boolean().nullable().optional().describe('Filter summaries by invoice type (true for invoices, false for other documents)'),
      success: z.boolean().nullable().optional().describe('Filter summaries by processing success status'),
      date_from: z.string().nullable().optional().describe('Filter summaries created after this date (ISO 8601 format)'),
      date_to: z.string().nullable().optional().describe('Filter summaries created before this date (ISO 8601 format)'),
    }),
    async execute(input) {
      const { is_invoice, success, date_from, date_to } = input;
      try {
        const filters: SummaryFilters = {};
        if (is_invoice !== null && is_invoice !== undefined) filters.is_invoice = is_invoice;
        // Note: success filter is not available in SummaryFilters, filtering by processing_status instead
        if (date_from) filters.created_at_from = new Date(date_from);
        if (date_to) filters.created_at_to = new Date(date_to);

        const count = await invoiceRepository.countSummaries(filters);
        
        return {
          count,
          filters: {
            is_invoice: is_invoice ?? 'all',
            success: success ?? 'all',
            date_from: date_from || null,
            date_to: date_to || null,
          },
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to count summaries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getSummariesTool,
    getSummaryByIdTool,
    getSummaryByFileIdTool,
    countSummariesTool,
  };
}

