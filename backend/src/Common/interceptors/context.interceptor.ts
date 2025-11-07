import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import * as httpContext from 'express-http-context';
import { Request } from 'express';
import { UserType } from '../consts/userType';
import { UserContext } from '../Infrastructure/types/user-context.type';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const request = httpCtx.getRequest<Request & { user?: any }>();

    // Get existing context or create new one from request.user
    const existingContext = httpContext.get('user_context') as UserContext | undefined;
    let userContext: UserContext = existingContext || {
      accountId: request.user?.accountId,
      userId: request.user?.userId,
      userType: request.user?.userType,
      entityId: request.user?.entityId,
    };

    // Operator can override accountId via header or query param
    if (userContext.userType === UserType.operator) {
      const headerOverride = request.headers['x-account-id'] as string;
      const queryParam = (request.query as any)?.['account_id'] ?? (request.query as any)?.['accountId'];
      const queryOverride = typeof queryParam === 'string' ? queryParam : undefined;

      if (headerOverride) {
        userContext.accountId = headerOverride;
      } else if (queryOverride) {
        userContext.accountId = queryOverride;
      }
    }

    // Update httpContext with merged/updated context
    httpContext.set('user_context', userContext);

    return next.handle();
  }
} 