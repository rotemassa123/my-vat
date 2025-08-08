import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../consts/userType';
import * as httpContext from 'express-http-context';

/**
 * Extracts the current user ID (string) from request.user.
 * JwtAuthGuard must populate req.user with { accountId, userId, role }.
 */
export const CurrentUserId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Primary source: AsyncLocalStorage populated by TenantContextInterceptor
    let userId = httpContext.get('user_id') as string | undefined;
    const userType = httpContext.get('user_type') as UserType | undefined;

    // Fallback to request.user if context is not available
    if (!userId && request.user?.userId) {
      userId = request.user.userId;
    }

    // Operator override via header (if needed for user impersonation)
    const override = request.headers['x-user-id'] as string;
    if (override && userType === UserType.operator) {
      // Basic validation for override could be added here (e.g., isMongoId)
      userId = override;
    }

    return userId;
  },
);
