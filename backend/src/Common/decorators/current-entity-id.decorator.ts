import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../../Common/consts/userType';
import * as httpContext from 'express-http-context';

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

    // Primary source: AsyncLocalStorage populated by TenantContextInterceptor
    let entityId = httpContext.get('entity_id') as string | undefined;
    const userType = httpContext.get('role') as UserType | undefined;

    // Operator override via header
    const override = request.headers['x-entity-id'] as string;

    if (override && (userType === UserType.operator || userType === UserType.admin)) {
      entityId = override;
    }

    return entityId;
  },
);
