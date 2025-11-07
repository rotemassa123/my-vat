import { Schema, Query, Aggregate, Types } from 'mongoose';
import * as httpContext from 'express-http-context';
import mongoose from 'mongoose';
import { UserContext } from '../Infrastructure/types/user-context.type';

/**
 * AccountScopePlugin
 * ------------------
 * Automatically restricts every query / save / aggregate operation to the
 * current account (account_id) kept on `express-http-context`.
 * Also adds an account_id field to the schema (required or optional based on options).
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function AccountScopePlugin(schema: Schema, options?: { is_required?: boolean }) {
  const isRequired = options?.is_required ?? true;
    schema.add({
      account_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: isRequired,
        index: true,
        alias: 'accountId',
      },
    });

  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const getAccountId = (): string | undefined => {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    return userContext?.accountId;
  };

  /** Apply account filter to the current mongoose Query */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyAccountFilter = function <T>(this: Query<T, any>) {
    const accountId = getAccountId();
    if (!accountId) return;
    if ((this as any).options?.disableAccountScope) return;

    this.setQuery({ ...this.getQuery(), account_id: new Types.ObjectId(accountId) });
  };

  /** For aggregation pipelines prepend a $match stage */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyAccountFilterToAggregate = function <T>(this: Aggregate<T[]>) {
    const accountId = getAccountId();
    if (!accountId) return;
    if ((this as any).options?.disableAccountScope) return;

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

  queryMethods.forEach((m) => schema.pre(m as any, applyAccountFilter));

  schema.pre('aggregate', applyAccountFilterToAggregate);

  schema.pre('save', function (next) {
    const accountId = getAccountId();
    if (accountId && !this.get('account_id')) {
      this.set('account_id', new Types.ObjectId(accountId));
    }
    next();
  });

  // Static helper: Model.forAccount(id)
  schema.static('forAccount', function (accountId: string | mongoose.Types.ObjectId) {
    return this.find({ account_id: accountId });
  });

  schema.static('withoutAccountScope', function () {
    return (this as any).setOptions({ disableAccountScope: true });
  });
} 