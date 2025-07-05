import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as httpContext from 'express-http-context';
import { Request } from 'express';
import { UserType } from '../consts/userType';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request & { user?: any }>();

    // Default comes from authenticated user
    let accountId: string | undefined = request.user?.accountId;

    // Operator can override via header or query param
    if (request.user?.userType === UserType.operator) {
      const headerOverride = request.headers['x-account-id'] as string;
      const queryParam = (request.query as any)?.['account_id'] ?? (request.query as any)?.['accountId'];
      const queryOverride = typeof queryParam === 'string' ? queryParam : undefined;

      if (headerOverride) {
        accountId = headerOverride;
      } else if (queryOverride) {
        accountId = queryOverride;
      }
    }

    // Persist into async context for downstream consumers
    if (accountId) {
      httpContext.set('account_id', accountId);
    }
    if (request.user?.userId) {
      httpContext.set('user_id', request.user.userId);
    }
    if (request.user?.userType !== undefined) {
      httpContext.set('role', request.user.userType);
    }

    return next.handle();
  }
} 