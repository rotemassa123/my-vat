import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiParam, ApiQuery, ApiOperation } from "@nestjs/swagger";
import { SummaryFilterRequest, SummaryPaginationRequest } from "../Requests/invoice.requests";
import { SummaryResponse, SummaryListResponse } from "../Responses/invoice.responses";
import { IInvoiceRepository } from "src/Common/ApplicationCore/Services/IInvoiceRepository";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("summaries")
@Controller("summaries")
export class SummaryController {
  constructor(private invoiceService: IInvoiceRepository) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get summaries with filters', 
    description: 'Retrieve invoice analysis summaries with comprehensive filtering, pagination, and sorting options' 
  })
  @ApiQuery({ name: 'file_id', required: false, type: String, description: 'Filter by file ID' })
  @ApiQuery({ name: 'is_invoice', required: false, type: Boolean, description: 'Filter by invoice classification' })
  @ApiQuery({ name: 'processing_status', required: false, type: String, description: 'Filter by processing status' })
  @ApiQuery({ name: 'currency', required: false, type: String, description: 'Filter by currency code' })
  @ApiQuery({ name: 'vendor_name_contains', required: false, type: String, description: 'Filter by vendor name (contains)' })
  @ApiQuery({ name: 'confidence_score_min', required: false, type: Number, description: 'Minimum confidence score (0-1)' })
  @ApiQuery({ name: 'confidence_score_max', required: false, type: Number, description: 'Maximum confidence score (0-1)' })
  @ApiQuery({ name: 'vat_amount_min', required: false, type: Number, description: 'Minimum VAT amount' })
  @ApiQuery({ name: 'vat_amount_max', required: false, type: Number, description: 'Maximum VAT amount' })
  @ApiQuery({ name: 'total_amount_min', required: false, type: Number, description: 'Minimum total amount' })
  @ApiQuery({ name: 'total_amount_max', required: false, type: Number, description: 'Maximum total amount' })
  @ApiQuery({ name: 'invoice_date_from', required: false, type: String, description: 'Invoice date from (ISO)' })
  @ApiQuery({ name: 'invoice_date_to', required: false, type: String, description: 'Invoice date to (ISO)' })
  @ApiQuery({ name: 'created_at_from', required: false, type: String, description: 'Created after date (ISO)' })
  @ApiQuery({ name: 'created_at_to', required: false, type: String, description: 'Created before date (ISO)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-5000)', example: 50 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip', example: 0 })
  async getSummaries(
    @Query() filters: SummaryFilterRequest,
    @Query() pagination: SummaryPaginationRequest
  ): Promise<SummaryListResponse> {
    try {
      logger.info("Fetching summaries with filters", SummaryController.name, { 
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      });

      const { limit = 50, skip = 0 } = pagination;

      // Execute both queries in parallel for better performance
      const [summaries, total] = await Promise.all([
        this.invoiceService.findSummaries(filters, limit, skip),
        this.invoiceService.countSummaries(filters)
      ]);

      return {
        data: summaries as SummaryResponse[],
        metadata: {
          total,
          limit,
          skip,
          count: summaries.length
        }
      };
    } catch (error) {
      logger.error("Error fetching summaries", SummaryController.name, { 
        error: error.message, 
        filters: JSON.stringify(filters),
        pagination: JSON.stringify(pagination)
      });
      throw error;
    }
  }

  @Get(":id")
  @ApiOperation({ 
    summary: 'Get summary by ID', 
    description: 'Retrieve a specific invoice summary by its unique identifier' 
  })
  @ApiParam({ name: "id", type: String, description: 'Summary ID' })
  async getSummaryById(@Param("id") id: string): Promise<SummaryResponse> {
    try {
      logger.info("Fetching summary by ID", SummaryController.name, { id });

      const summary = await this.invoiceService.findSummaryById(id);
      if (!summary) {
        throw new NotFoundException(`Summary with ID ${id} not found`);
      }

      return summary as SummaryResponse;
    } catch (error) {
      logger.error("Error fetching summary by ID", SummaryController.name, { 
        error: error.message, 
        id 
      });
      throw error;
    }
  }

  @Get("by-file/:fileId")
  @ApiOperation({ 
    summary: 'Get summary by file ID', 
    description: 'Retrieve invoice summary by the original file identifier' 
  })
  @ApiParam({ name: "fileId", type: String, description: 'Original file ID' })
  async getSummaryByFileId(@Param("fileId") fileId: string): Promise<SummaryResponse> {
    try {
      logger.info("Fetching summary by file ID", SummaryController.name, { fileId });

      const summary = await this.invoiceService.findSummaryByFileId(fileId);
      if (!summary) {
        throw new NotFoundException(`Summary for file ID ${fileId} not found`);
      }

      return summary as SummaryResponse;
    } catch (error) {
      logger.error("Error fetching summary by file ID", SummaryController.name, { 
        error: error.message, 
        fileId 
      });
      throw error;
    }
  }
} 