import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../../Common/consts/userType';
import * as httpContext from 'express-http-context';
import { UserContext } from '../../Common/Infrastructure/types/user-context.type';

export interface JwtUser {
  accountId: string;
  entityId: string;
  userType: UserType;
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

    if (override && (userContext?.userType === UserType.operator || userContext?.userType === UserType.admin)) {
      entityId = override;
    }

    return entityId;
  },
);
