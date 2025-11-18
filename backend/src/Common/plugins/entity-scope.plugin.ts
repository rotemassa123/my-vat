import { Schema, Query, Aggregate, Types } from 'mongoose';
import * as httpContext from 'express-http-context';
import mongoose from 'mongoose';
import { UserContext } from '../Infrastructure/types/user-context.type';

/**
 * EntityScopePlugin
 * -----------------
 * Automatically restricts every query / save / aggregate operation to the
 * current entity (entity_id) kept on `express-http-context`.
 * Also adds an entity_id field to the schema (required or optional based on options).
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function EntityScopePlugin(schema: Schema, options?: { is_required?: boolean }) {
  const isRequired = options?.is_required ?? true;
    schema.add({
      entity_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entity',
        required: isRequired,
        index: true,
        alias: 'entityId',
      },
    });
  

  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const getEntityId = (): string | undefined => {
    const userContext = httpContext.get('user_context') as UserContext | undefined;
    return userContext?.entityId;
  };

  /** Apply entity filter to the current mongoose Query */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyEntityFilter = function <T>(this: Query<T, any>) {
    const entityId = getEntityId();
    if (!entityId) return;
    if ((this as any).options?.disableEntityScope) return;

    this.setQuery({ ...this.getQuery(), entity_id: new Types.ObjectId(entityId) });
  };

  /** For aggregation pipelines prepend a $match stage */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const applyEntityFilterToAggregate = function <T>(this: Aggregate<T[]>) {
    const entityId = getEntityId();
    if (!entityId) return;
    if ((this as any).options?.disableEntityScope) return;

    const firstStage = this.pipeline()[0];
    if (!firstStage || !('$match' in firstStage) || !('entity_id' in firstStage.$match)) {
      this.pipeline().unshift({ $match: { entity_id: new Types.ObjectId(entityId) } });
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

  queryMethods.forEach((m) => schema.pre(m as any, applyEntityFilter));

  schema.pre('aggregate', applyEntityFilterToAggregate);

  // Use pre('validate') to set fields BEFORE validation runs
  // Note: entity_id is optional (is_required: false for widgets), so we don't throw if missing
  schema.pre('validate', function (next) {
    try {
      const entityId = getEntityId();
      
      // Only set entity_id if it exists in context and isn't already set
      // This is optional, so we don't throw an error if missing
      if (entityId && !this.get('entity_id')) {
        this.set('entity_id', new Types.ObjectId(entityId));
      }
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  // Static helper: Model.forEntity(id)
  schema.static('forEntity', function (entityId: string | mongoose.Types.ObjectId) {
    return this.find({ entity_id: entityId });
  });

  schema.static('withoutEntityScope', function () {
    return (this as any).setOptions({ disableEntityScope: true });
  });
} 