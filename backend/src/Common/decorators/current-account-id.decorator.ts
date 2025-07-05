import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserType } from '../../Common/consts/userType';
import * as httpContext from 'express-http-context';

export interface JwtUser {
  accountId: string;
  userType: UserType;
}

/**
 * Extracts the tenant accountId (string) from request.user.
 * JwtAuthGuard must populate req.user with { accountId, userId, role }.
 */
export const CurrentAccountId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    // Primary source: AsyncLocalStorage populated by TenantContextInterceptor
    let accountId = httpContext.get('account_id') as string | undefined;
    const userType = httpContext.get('role') as UserType | undefined;

    // Operator override via header
    const override = request.headers['x-account-id'] as string;

    if (override && userType === UserType.operator) {
      // Basic validation for override could be added here (e.g., isMongoId)
      accountId = override;
    }

    return accountId;
  },
); 