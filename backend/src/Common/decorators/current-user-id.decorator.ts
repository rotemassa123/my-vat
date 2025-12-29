import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../consts/userRole';
import * as httpContext from 'express-http-context';
import { UserContext } from '../Infrastructure/types/user-context.type';

/**
 * Extracts the current user ID (string) from request.user.
 * JwtAuthGuard must populate req.user with { accountId, userId, role }.
 */
export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Primary source: httpContext populated by AuthenticationGuard/TenantContextInterceptor
    const userContext = httpContext.get('user_context') as UserContext | undefined;

    // Operator override via header (if needed for user impersonation)
    const override = request.headers['x-user-id'] as string;
    if (override && userContext?.userType === UserRole.OPERATOR) {
      // Basic validation for override could be added here (e.g., isMongoId)
      return override;
    }

    return userContext?.userId;
  },
);
