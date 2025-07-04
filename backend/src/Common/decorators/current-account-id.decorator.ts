import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../../Common/consts/userType';
import * as httpContext from 'express-http-context';

export interface JwtUser {
  accountId: number;
  userType: UserType;
}

/**
 * Extracts the tenant accountId (numeric) from request.user.
 * JwtAuthGuard must populate req.user with { accountId, userId, role }.
 */
export const CurrentAccountId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();

    // Primary source: AsyncLocalStorage populated by TenantContextInterceptor
    let accountId = httpContext.get('account_id') as number | undefined;
    const userType = httpContext.get('role') as UserType | undefined;

    // Operator override via header
    const override = request.headers['x-account-id'];

    if (override && userType === UserType.operator) {
      const parsed = Number(override);
      if (!Number.isNaN(parsed)) {
        accountId = parsed;
      }
    }

    return accountId;
  },
); 