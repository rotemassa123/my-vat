import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Delete,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ReportingQueryRequest } from "../Requests/reporting.requests";
import { ReportingService } from "../Services/reporting.service";
import { ReportingCacheService } from "../Services/reporting-cache.service";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserType } from "src/Common/consts/userType";
import { logger } from "src/Common/Infrastructure/Config/Logger";

@ApiTags("reporting")
@Controller("reporting")
@UseGuards(AuthenticationGuard)
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService,
    private readonly cacheService: ReportingCacheService
  ) {}

  @Get("invoices")
  @ApiOperation({ summary: "Get paginated and filtered reporting data" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "skip", required: false, type: Number })
  async getReportingData(
    @Query() params: ReportingQueryRequest,
    @Req() request: { user: { accountId: string; entityId?: string; userType: UserType; userId: string } }
  ) {
    try {
      const user = request.user;
      const userContext = {
        accountId: user.accountId,
        entityId: user.entityId,
        userType: user.userType, // Keep numeric
      };

      logger.info("Fetching reporting data", ReportingController.name, { 
        params: JSON.stringify(params),
        user: userContext,
        originalUserType: user.userType // Log original for debugging
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

  @Delete("cache")
  @ApiOperation({ summary: "Clear all reporting cache" })
  async clearCache() {
    try {
      this.cacheService.invalidateAll();
      logger.info("Reporting cache cleared", ReportingController.name);
      return { success: true, message: "Cache cleared successfully" };
    } catch (error) {
      logger.error("Error clearing cache", ReportingController.name, { error: error.message });
      throw error;
    }
  }
} 