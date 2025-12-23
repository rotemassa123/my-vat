import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiParam, ApiQuery, ApiOperation } from "@nestjs/swagger";
import { InvoiceFilterRequest, InvoicePaginationRequest, CombinedInvoiceFilterRequest } from "../Requests/invoice.requests";
import { InvoiceResponse, InvoiceListResponse, CombinedInvoiceListResponse } from "../Responses/invoice.responses";
import { IInvoiceRepository } from "src/Common/ApplicationCore/Services/IInvoiceRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";

@ApiTags("invoices")
@Controller("invoices")
@UseGuards(AuthenticationGuard)
export class InvoiceController {
  constructor(private invoiceService: IInvoiceRepository) {}

  @Get("combined")
  @ApiOperation({ 
    summary: 'Get combined invoices with summary data', 
    description: 'Retrieve invoices joined with their summary data.' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-5000)', example: 50 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip for pagination', example: 0 })
  async getCombinedInvoices(@Query() request: CombinedInvoiceFilterRequest): Promise<CombinedInvoiceListResponse> {
    try {
      logger.info("Fetching combined invoices with summary data", InvoiceController.name, { 
        limit: request.limit,
        skip: request.skip
      });

      const result = await this.invoiceService.findCombinedInvoices(
        request,
        request.limit || 50,
        request.skip || 0
      );

      const response: CombinedInvoiceListResponse = {
        data: result.data.map(invoice => ({
          // Core invoice fields
          _id: invoice._id,
          account_id: invoice.account_id.toString(),
          name: invoice.name,
          source_id: invoice.source_id,
          size: invoice.size,
          last_executed_step: invoice.last_executed_step,
          source: invoice.source,
          status: invoice.status,
          reason: invoice.reason,
          claim_amount: invoice.claim_amount,
          claim_submitted_at: invoice.claim_submitted_at,
          claim_result_received_at: invoice.claim_result_received_at,
          status_updated_at: invoice.status_updated_at,
          created_at: invoice.created_at,
          
          // Summary metadata fields
          is_invoice: invoice.is_invoice,
          processing_time_seconds: invoice.processing_time_seconds,
          success: invoice.success,
          error_message: invoice.error_message,
          confidence_score: invoice.confidence_score,
          
          // Flattened summary content fields (extracted data)
          country: invoice.country,
          supplier: invoice.supplier,
          invoice_date: invoice.invoice_date,
          invoice_number: invoice.invoice_number,
          description: invoice.description,
          net_amount: invoice.net_amount,
          vat_amount: invoice.vat_amount,
          vat_rate: invoice.vat_rate,
          currency: invoice.currency,
          
          // Computed fields
          vendor_name: invoice.vendor_name,
          total_amount: invoice.total_amount,
        })),
        metadata: {
          total: result.total,
          limit: result.limit,
          skip: result.skip,
          count: result.count
        }
      };

      logger.info("Successfully fetched combined invoices", InvoiceController.name, { 
        total: result.total,
        returned: result.count
      });

      return response;

    } catch (error) {
      logger.error("Error fetching combined invoices", InvoiceController.name, { 
        error: error.message
      });
      throw error;
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get invoices with filters', 
    description: 'Retrieve invoices with comprehensive filtering, pagination, and sorting options' 
  })
  @ApiQuery({ name: 'source_id', required: false, type: String, description: 'Filter by source ID' })
  @ApiQuery({ name: 'source', required: false, type: String, description: 'Filter by source type' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by processing status' })
  @ApiQuery({ name: 'content_type', required: false, type: String, description: 'Filter by content type' })
  @ApiQuery({ name: 'last_executed_step', required: false, type: Number, description: 'Filter by execution step' })
  @ApiQuery({ name: 'name_contains', required: false, type: String, description: 'Filter by file name (contains)' })
  @ApiQuery({ name: 'size_min', required: false, type: Number, description: 'Minimum file size' })
  @ApiQuery({ name: 'size_max', required: false, type: Number, description: 'Maximum file size' })
  @ApiQuery({ name: 'created_at_from', required: false, type: String, description: 'Created after date (ISO)' })
  @ApiQuery({ name: 'created_at_to', required: false, type: String, description: 'Created before date (ISO)' })
  @ApiQuery({ name: 'status_updated_at_from', required: false, type: String, description: 'Status updated after date (ISO)' })
  @ApiQuery({ name: 'status_updated_at_to', required: false, type: String, description: 'Status updated before date (ISO)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-5000)', example: 50 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip', example: 0 })
  async getInvoices(
    @Query() filters: InvoiceFilterRequest,
    @Query() pagination: InvoicePaginationRequest
  ): Promise<InvoiceListResponse> {
    try {
      logger.info("Fetching invoices with filters", InvoiceController.name, { 
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      });

      const { limit = 50, skip = 0 } = pagination;

      // Execute both queries in parallel for better performance
      const [invoices, total] = await Promise.all([
        this.invoiceService.findInvoices(filters, limit, skip),
        this.invoiceService.countInvoices(filters)
      ]);

      return {
        data: invoices.map(invoice => ({
          ...invoice,
          account_id: invoice.account_id.toString(),
        })) as InvoiceResponse[],
        metadata: {
          total,
          limit,
          skip,
          count: invoices.length
        }
      };
    } catch (error) {
      logger.error("Error fetching invoices", InvoiceController.name, { 
        error: error.message, 
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      });
      throw error;
    }
  }

  @Get("export")
  @ApiOperation({ 
    summary: 'Export invoices to CSV', 
    description: 'Export filtered invoices to CSV format' 
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum items to export (default: 10000)', example: 10000 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip', example: 0 })
  async exportInvoices(
    @Query() request: CombinedInvoiceFilterRequest,
    @Res() res: Response
  ): Promise<void> {
    try {
      logger.info("Exporting invoices to CSV", InvoiceController.name, { 
        limit: request.limit,
        skip: request.skip
      });

      // Don't pass limit/skip - get all invoices with filters applied
      const result = await this.invoiceService.findCombinedInvoices(
        request
      );

      const csv = this.convertToCSV(result.data);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="invoices_${new Date().toISOString().split('T')[0]}.csv"`);
      
      res.send(csv);

      logger.info("Successfully exported invoices to CSV", InvoiceController.name, { 
        count: result.data.length
      });
    } catch (error) {
      logger.error("Error exporting invoices to CSV", InvoiceController.name, { 
        error: error.message
      });
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) {
      return 'No data available\n';
    }

    const headers = [
      'ID',
      'File Name',
      'Invoice Number',
      'Invoice Date',
      'Supplier',
      'Country',
      'Currency',
      'Net Amount',
      'VAT Amount',
      'VAT Rate',
      'Total Amount',
      'Status',
      'Claim Amount',
      'Created At',
      'Status Updated At'
    ];

    const rows = data.map(invoice => {
      return [
        invoice._id || '',
        invoice.name || '',
        invoice.invoice_number || '',
        invoice.invoice_date || '',
        invoice.supplier || invoice.vendor_name || '',
        invoice.country || '',
        invoice.currency || '',
        invoice.net_amount || '',
        invoice.vat_amount || '',
        invoice.vat_rate || '',
        invoice.total_amount || '',
        invoice.status || '',
        invoice.claim_amount || '',
        invoice.created_at ? new Date(invoice.created_at).toISOString() : '',
        invoice.status_updated_at ? new Date(invoice.status_updated_at).toISOString() : ''
      ];
    });

    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ];

    return csvLines.join('\n');
  }

  @Get(":id")
  @ApiOperation({ 
    summary: 'Get invoice by ID', 
    description: 'Retrieve a specific invoice by its unique identifier' 
  })
  @ApiParam({ name: "id", type: String, description: 'Invoice ID' })
  async getInvoiceById(@Param("id") id: string): Promise<InvoiceResponse> {
    try {
      logger.info("Fetching invoice by ID", InvoiceController.name, { id });

      const invoice = await this.invoiceService.findInvoiceById(id);
      if (!invoice) {
        throw new NotFoundException(`Invoice with ID ${id} not found`);
      }

      return {
        ...invoice,
        account_id: invoice.account_id.toString(),
      } as InvoiceResponse;
    } catch (error) {
      logger.error("Error fetching invoice by ID", InvoiceController.name, { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }

} 