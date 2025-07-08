import { Schema, Query, Aggregate, Types } from 'mongoose';
import * as httpContext from 'express-http-context';

/**
 * EntityScopePlugin
 * -----------------
 * Automatically restricts every query / save / aggregate operation to the
 * current entity (entity_id) kept on `express-http-context`.
 *
 * Register this plugin on every entity-scoped schema **after**
 * `EntityBoundPlugin`. Do NOT apply it to global collections such as
 * `Account` or `Entity`.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function EntityScopePlugin(schema: Schema) {
  /* -------------------------------------------------------------------------- */
  /* Helpers                                                                    */
  /* -------------------------------------------------------------------------- */
  const getEntityId = (): string | undefined => {
    const id = httpContext.get('entity_id');
    return typeof id === 'string' && id ? id : undefined;
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

  schema.pre('save', function (next) {
    const entityId = getEntityId();
    if (entityId && !this.get('entity_id')) {
      this.set('entity_id', new Types.ObjectId(entityId));
    }
    next();
  });

  schema.static('withoutEntityScope', function () {
    return (this as any).setOptions({ disableEntityScope: true });
  });
} 