import { ExecutionContext } from '@nestjs/common';
import * as httpContext from 'express-http-context';
import { CurrentAccountId } from '../../src/Common/decorators/current-account-id.decorator';
import { UserRole } from '../../src/Common/consts/userRole';

// Helper to create a minimal ExecutionContext stub
const createContextStub = (req: Record<string, any>): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
};

describe.skip('CurrentAccountId decorator', () => {
  afterEach(() => {
    httpContext.set('account_id', undefined);
    httpContext.set('role', undefined);
  });

  it('should return accountId from AsyncLocalStorage', () => {
    httpContext.set('account_id', 123);
    const ctx = createContextStub({});
    const result = CurrentAccountId(undefined, ctx);
    expect(result).toBe(123);
  });

  it('should return overridden accountId when userType is operator', () => {
    httpContext.set('role', UserRole.OPERATOR);
    const ctx = createContextStub({ headers: { 'x-account-id': '456' } });
    const result = CurrentAccountId(undefined, ctx);
    expect(result).toBe(456);
  });

  it('should return undefined when not present', () => {
    const ctx = createContextStub({});
    const result = CurrentAccountId(undefined, ctx);
    expect(result).toBeUndefined();
  });
}); 