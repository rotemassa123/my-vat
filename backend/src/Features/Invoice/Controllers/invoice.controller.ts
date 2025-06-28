import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiParam, ApiQuery, ApiOperation } from "@nestjs/swagger";
import { InvoiceFilterRequest, InvoicePaginationRequest } from "../Requests/invoice.requests";
import { InvoiceResponse, InvoiceListResponse } from "../Responses/invoice.responses";
import { IInvoiceRepository } from "src/Common/ApplicationCore/Services/IInvoiceRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("invoices")
@Controller("invoices")
export class InvoiceController {
  constructor(private invoiceService: IInvoiceRepository) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get invoices with filters', 
    description: 'Retrieve invoices with comprehensive filtering, pagination, and sorting options' 
  })
  @ApiQuery({ name: 'account_id', required: false, type: Number, description: 'Filter by account ID' })
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
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-1000)', example: 50 })
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
        data: invoices as InvoiceResponse[],
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

      return invoice as InvoiceResponse;
    } catch (error) {
      logger.error("Error fetching invoice by ID", InvoiceController.name, { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }
} 