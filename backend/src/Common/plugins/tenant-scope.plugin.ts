import { Schema, Query, Aggregate, Types } from 'mongoose';
import * as httpContext from 'express-http-context';

/**
 * TenantScopePlugin
 * -----------------
 * Automatically restricts every query / save / aggregate operation to the
 * current tenant (account_id) kept on `express-http-context`.
 *
 * Register this plugin on every tenant-scoped schema **after**
 * `AccountBoundPlugin`. Do NOT apply it to global collections such as
 * `Account`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function TenantScopePlugin(schema: Schema) {
  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const getAccountId = (): string | undefined => {
    const id = httpContext.get('account_id');
    return typeof id === 'string' && id ? id : undefined;
  };

  /** Apply tenant filter to the current mongoose Query */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyTenantFilter = function <T>(this: Query<T, any>) {
    const accountId = getAccountId();
    if (!accountId) return;
    if ((this as any).options?.disableTenantScope) return;

    this.setQuery({ ...this.getQuery(), account_id: new Types.ObjectId(accountId) });
  };

  /** For aggregation pipelines prepend a $match stage */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyTenantFilterToAggregate = function <T>(this: Aggregate<T[]>) {
    const accountId = getAccountId();
    if (!accountId) return;
    if ((this as any).options?.disableTenantScope) return;

    const firstStage = this.pipeline()[0];
    if (!firstStage || !('$match' in firstStage) || !('account_id' in firstStage.$match)) {
      this.pipeline().unshift({ $match: { account_id: new Types.ObjectId(accountId) } });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Hook registrations                                                          */
  /* -------------------------------------------------------------------------- */
  const queryMethods: string[] = [
    'count',
    'countDocuments',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndUpdate',
    'deleteMany',
    'deleteOne',
    'updateMany',
    'updateOne',
  ];

  queryMethods.forEach((m) => schema.pre(m as any, applyTenantFilter));

  schema.pre('aggregate', applyTenantFilterToAggregate);

  schema.pre('save', function (next) {
    const accountId = getAccountId();
    if (accountId && !this.get('account_id')) {
      this.set('account_id', new Types.ObjectId(accountId));
    }
    next();
  });

  schema.static('withoutTenantScope', function () {
    return (this as any).setOptions({ disableTenantScope: true });
  });
} 