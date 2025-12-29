import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../Common/consts/userRole';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../Common/Infrastructure/types/user-context.type';

export interface JwtUser {
  accountId: string;
  entityId: string;
  userType: UserRole;
}

/**
 * Extracts the tenant entityId (string) from request.user.
 * JwtAuthGuard must populate req.user with { accountId, entityId, userType }.
 */
export const CurrentEntityId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Primary source: httpContext populated by AuthenticationGuard/TenantContextInterceptor
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    let entityId = userContext?.entityId;

    // Operator/Admin override via header
    const override = request.headers['x-entity-id'] as string;

    if (override && (userContext?.userType === UserRole.OPERATOR || userContext?.userType === UserRole.ADMIN)) {
      entityId = override;
    }

    return entityId;
  },
);
