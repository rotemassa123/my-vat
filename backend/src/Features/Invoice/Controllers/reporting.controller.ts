import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ReportingQueryRequest } from "../Requests/reporting.requests";
import { ReportingService } from "../Services/reporting.service";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("reporting")
@Controller("reporting")
@UseGuards(AuthenticationGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get("invoices")
  @ApiOperation({ 
    summary: 'Get reporting data with advanced filtering and sorting',
    description: 'Retrieve invoices with comprehensive filtering, pagination, sorting, and tenant isolation'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-500)', example: 100 })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Items to skip for pagination', example: 0 })
  @ApiQuery({ name: 'sort_by', required: false, type: String, description: 'Field to sort by', example: 'created_at' })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['asc', 'desc'], description: 'Sort order', example: 'desc' })
  @ApiQuery({ name: 'status', required: false, type: [String], description: 'Filter by status values' })
  @ApiQuery({ name: 'vat_scheme', required: false, type: [String], description: 'Filter by VAT schemes' })
  @ApiQuery({ name: 'currency', required: false, type: [String], description: 'Filter by currencies' })
  async getReportingData(
    @Query() params: ReportingQueryRequest,
    @Req() request: { user: { accountId: string; entityId?: string; userType: 'admin' | 'member' | 'guest' | 'operator'; userId: string } }
  ) {
    try {
      const user = request.user;
      const userContext = {
        accountId: user.accountId,
        entityId: user.entityId,
        userType: user.userType,
      };

      logger.info("Fetching reporting data", ReportingController.name, { 
        params: JSON.stringify(params),
        user: userContext
      });

      const result = await this.reportingService.getReportingData(userContext, params);

      logger.info("Successfully fetched reporting data", ReportingController.name, { 
        total: result.metadata.total,
        returned: result.metadata.count,
        cache_hit: result.metadata.cache_hit,
        user_scope: result.metadata.user_scope
      });

      return result;

    } catch (error) {
      logger.error("Error fetching reporting data", ReportingController.name, { 
        error: error.message, 
        params: JSON.stringify(params),
        userId: request.user?.userId 
      });
      throw error;
    }
  }


} 