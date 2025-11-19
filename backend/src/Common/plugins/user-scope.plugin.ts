import { Schema, Query, Aggregate, Types } from 'mongoose';
import * as httpContext from 'express-http-context';
import mongoose from 'mongoose';
import { UserContext } from '../Infrastructure/types/user-context.type';

/**
 * UserScopePlugin
 * ---------------
 * Automatically restricts every query / save / aggregate operation to the
 * current user (user_id) kept on `express-http-context`.
 * Also adds a user_id field to the schema (required or optional based on options).
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function UserScopePlugin(schema: Schema, options?: { is_required?: boolean }) {
  const isRequired = options?.is_required ?? true;
  schema.add({
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: isRequired,
      index: true,
      alias: 'userId',
    },
  });

  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const getUserId = (): string | undefined => {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    return userContext?.userId;
  };

  /** Apply user filter to the current mongoose Query */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyUserFilter = function <T>(this: Query<T, any>) {
    const userId = getUserId();
    if (!userId) return;
    if ((this as any).options?.disableUserScope) return;

    this.setQuery({ ...this.getQuery(), user_id: new Types.ObjectId(userId) });
  };

  /** For aggregation pipelines prepend a $match stage */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyUserFilterToAggregate = function <T>(this: Aggregate<T[]>) {
    const userId = getUserId();
    if (!userId) return;
    if ((this as any).options?.disableUserScope) return;

    const firstStage = this.pipeline()[0];
    if (!firstStage || !('$match' in firstStage) || !('user_id' in firstStage.$match)) {
      this.pipeline().unshift({ $match: { user_id: new Types.ObjectId(userId) } });
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

  queryMethods.forEach((m) => schema.pre(m as any, applyUserFilter));

  schema.pre('aggregate', applyUserFilterToAggregate);

  // Use pre('validate') to set fields BEFORE validation runs
  schema.pre('validate', function (next) {
    try {
      const userId = getUserId();  
      this.set('user_id', new Types.ObjectId(userId));
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  // Static helper: Model.forUser(id)
  schema.static('forUser', function (userId: string | mongoose.Types.ObjectId) {
    return this.find({ user_id: userId });
  });

  schema.static('withoutUserScope', function () {
    return (this as any).setOptions({ disableUserScope: true });
  });
}

