import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  Delete,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";
import { ReportingQueryRequest } from "../Requests/reporting.requests";
import { ReportingService } from "../Services/reporting.service";
import { ReportingCacheService } from "../Services/reporting-cache.service";
import { AuthenticationGuard } from "src/Common/Infrastructure/guards/authentication.guard";
import { UserRole } from "src/Common/consts/userRole";
import { logger } from "src/Common/Infrastructure/Config/Logger";
import * as httpContext from 'express-http-context';
import { UserContext } from "src/Common/Infrastructure/types/user-context.type";

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
    @Req() request: Request
  ) {
    try {
      const userContextFromHttp = httpContext.get('user_context') as UserContext | undefined;
      
      if (!userContextFromHttp) {
        throw new UnauthorizedException('User context not found');
      }

      const userContext = {
        accountId: userContextFromHttp.accountId,
        entityId: userContextFromHttp.entityId,
        userType: userContextFromHttp.userType, // Keep numeric
      };

      logger.info("Fetching reporting data", ReportingController.name, { 
        params: JSON.stringify(params),
        user: userContext,
        originalUserType: userContext.userType // Log original for debugging
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
      const userContextFromHttp = httpContext.get('user_context') as UserContext | undefined;
      logger.error("Error fetching reporting data", ReportingController.name, { 
        error: error.message, 
        params: JSON.stringify(params),
        userId: userContextFromHttp?.userId 
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