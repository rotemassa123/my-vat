import { tool } from '@openai/agents';
import { z } from 'zod';
import { IInvoiceRepository, InvoiceExtractedDataFilters } from '../../../../Common/ApplicationCore/Services/IInvoiceRepository';

/**
 * Tool factory that creates extraction tools with injected repository
 */
export function createExtractionTools(invoiceRepository: IInvoiceRepository) {
  const getExtractedDataTool = tool({
    name: 'get_extracted_data',
    description: 'Retrieves a list of invoices with extracted data from processed files. Use this when the user asks about processed documents, their extracted data, or document analysis results. Each invoice contains extracted fields like supplier name, invoice date, amounts, VAT details, and confidence scores.',
    parameters: z.object({
      file_id: z.string().nullable().optional().describe('Filter invoices by file ID'),
      is_invoice: z.boolean().nullable().optional().describe('Filter invoices by invoice type (true for invoices, false for other documents)'),
      success: z.boolean().nullable().optional().describe('Filter invoices by processing success status'),
      date_from: z.string().nullable().optional().describe('Filter invoices created after this date (ISO 8601 format, e.g., "2023-01-01")'),
      date_to: z.string().nullable().optional().describe('Filter invoices created before this date (ISO 8601 format, e.g., "2023-12-31")'),
      limit: z.number().nullable().optional().default(10).describe('Maximum number of invoices to return'),
      skip: z.number().nullable().optional().default(0).describe('Number of invoices to skip (for pagination)'),
    }),
    async execute(input) {
      const { file_id, is_invoice, success, date_from, date_to, limit, skip } = input;
      try {
        const filters: InvoiceExtractedDataFilters = {};
        if (file_id) filters.file_id = file_id;
        if (is_invoice !== null && is_invoice !== undefined) filters.is_invoice = is_invoice;
        // Note: success filter is not available in InvoiceExtractedDataFilters, filtering by processing_status instead
        if (date_from) filters.created_at_from = new Date(date_from);
        if (date_to) filters.created_at_to = new Date(date_to);

        const invoices = await invoiceRepository.findInvoicesWithExtraction(filters, limit, skip);
        
        return {
          invoices: invoices.map(invoice => ({
            id: invoice._id,
            file_id: invoice.file_id,
            file_name: invoice.file_name,
            is_invoice: invoice.is_invoice,
            success: invoice.success,
            created_at: invoice.created_at,
            confidence_score: invoice.confidence_score,
            processing_status: invoice.processing_status,
            error_message: invoice.error_message,
            // Extracted content fields
            country: invoice.extracted_content?.country,
            supplier: invoice.extracted_content?.supplier,
            date: invoice.extracted_content?.date,
            invoice_id: invoice.extracted_content?.id,
            description: invoice.extracted_content?.description,
            net_amount: invoice.extracted_content?.net_amount,
            vat_amount: invoice.extracted_content?.vat_amount,
            vat_rate: invoice.extracted_content?.vat_rate,
            currency: invoice.extracted_content?.currency,
            // Additional extracted fields
            total_amount: invoice.total_amount,
            vendor_name: invoice.vendor_name,
            invoice_date_extracted: invoice.invoice_date,
          })),
          count: invoices.length,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch extracted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getExtractionByIdTool = tool({
    name: 'get_extraction_by_id',
    description: 'Get a single invoice with extracted data by its ID. Returns detailed extracted data including all fields from the extracted content.',
    parameters: z.object({
      invoice_id: z.string().describe('The ID of the invoice to retrieve'),
    }),
    async execute(input) {
      const { invoice_id } = input;
      try {
        const invoice = await invoiceRepository.findInvoiceExtractionById(invoice_id);
        
        if (!invoice) {
          return {
            error: true,
            message: `Invoice with ID ${invoice_id} not found`,
          };
        }

        return {
          id: invoice._id,
          file_id: invoice.file_id,
          file_name: invoice.file_name,
          is_invoice: invoice.is_invoice,
          success: invoice.success,
          created_at: invoice.created_at,
          processing_time_seconds: invoice.processing_time_seconds,
          confidence_score: invoice.confidence_score,
          processing_status: invoice.processing_status,
          error_message: invoice.error_message,
          // Extracted content fields
          extracted_content: invoice.extracted_content ? {
            country: invoice.extracted_content.country,
            supplier: invoice.extracted_content.supplier,
            date: invoice.extracted_content.date,
            id: invoice.extracted_content.id,
            description: invoice.extracted_content.description,
            net_amount: invoice.extracted_content.net_amount,
            vat_amount: invoice.extracted_content.vat_amount,
            vat_rate: invoice.extracted_content.vat_rate,
            currency: invoice.extracted_content.currency,
          } : null,
          // Additional extracted fields
          total_amount: invoice.total_amount,
          vendor_name: invoice.vendor_name,
          invoice_date_extracted: invoice.invoice_date,
          invoice_number_extracted: invoice.invoice_number,
          analysis_result: invoice.analysis_result,
          extracted_data: invoice.extracted_data,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch extracted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const getExtractionByFileIdTool = tool({
    name: 'get_extraction_by_file_id',
    description: 'Get an invoice with extracted data by its file ID. Useful when you know the file ID and need to retrieve the extracted data for that specific file.',
    parameters: z.object({
      file_id: z.string().describe('The file ID of the invoice to retrieve'),
    }),
    async execute(input) {
      const { file_id } = input;
      try {
        const invoice = await invoiceRepository.findInvoiceExtractionByFileId(file_id);
        
        if (!invoice) {
          return {
            error: true,
            message: `Invoice with file ID ${file_id} not found`,
          };
        }

        return {
          id: invoice._id,
          file_id: invoice.file_id,
          file_name: invoice.file_name,
          is_invoice: invoice.is_invoice,
          success: invoice.success,
          created_at: invoice.created_at,
          processing_time_seconds: invoice.processing_time_seconds,
          confidence_score: invoice.confidence_score,
          processing_status: invoice.processing_status,
          error_message: invoice.error_message,
          // Extracted content fields
          extracted_content: invoice.extracted_content ? {
            country: invoice.extracted_content.country,
            supplier: invoice.extracted_content.supplier,
            date: invoice.extracted_content.date,
            id: invoice.extracted_content.id,
            description: invoice.extracted_content.description,
            net_amount: invoice.extracted_content.net_amount,
            vat_amount: invoice.extracted_content.vat_amount,
            vat_rate: invoice.extracted_content.vat_rate,
            currency: invoice.extracted_content.currency,
          } : null,
          // Additional extracted fields
          total_amount: invoice.total_amount,
          vendor_name: invoice.vendor_name,
          invoice_date_extracted: invoice.invoice_date,
          invoice_number_extracted: invoice.invoice_number,
          analysis_result: invoice.analysis_result,
          extracted_data: invoice.extracted_data,
        };
      } catch (error) {
        return {
          error: true,
          message: `Failed to fetch extracted data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  const countExtractionsTool = tool({
    name: 'count_extractions',
    description: 'Count the total number of invoices with extracted data matching the given filters. Useful for getting quick counts of processed documents.',
    parameters: z.object({
      is_invoice: z.boolean().nullable().optional().describe('Filter invoices by invoice type (true for invoices, false for other documents)'),
      success: z.boolean().nullable().optional().describe('Filter invoices by processing success status'),
      date_from: z.string().nullable().optional().describe('Filter invoices created after this date (ISO 8601 format)'),
      date_to: z.string().nullable().optional().describe('Filter invoices created before this date (ISO 8601 format)'),
    }),
    async execute(input) {
      const { is_invoice, success, date_from, date_to } = input;
      try {
        const filters: InvoiceExtractedDataFilters = {};
        if (is_invoice !== null && is_invoice !== undefined) filters.is_invoice = is_invoice;
        // Note: success filter is not available in InvoiceExtractedDataFilters, filtering by processing_status instead
        if (date_from) filters.created_at_from = new Date(date_from);
        if (date_to) filters.created_at_to = new Date(date_to);

        const count = await invoiceRepository.countInvoicesWithExtraction(filters);
        
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
          message: `Failed to count extractions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  });

  return {
    getExtractedDataTool,
    getExtractionByIdTool,
    getExtractionByFileIdTool,
    countExtractionsTool,
  };
}

