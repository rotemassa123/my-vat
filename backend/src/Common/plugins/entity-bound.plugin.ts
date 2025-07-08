import { Schema } from 'mongoose';
import mongoose from 'mongoose';
// No explicit HookNextFunction import to stay compatible across mongoose versions

/**
 * EntityBoundPlugin
 * -----------------
 * Adds a mandatory, indexed `entity_id` field to any schema and guarantees
 * it is present before the document is persisted. Attach it to every
 * entity-scoped collection (users, invoices, …). The `entities` collection
 * itself should NOT use this plugin.
 *
 * Usage:
 *   const UserSchema = new Schema({...});
 *   UserSchema.plugin(EntityBoundPlugin);
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function EntityBoundPlugin(schema: Schema) {
  // Add the column only if it does not already exist to prevent duplicate definitions
  if (!schema.path('entity_id')) {
    schema.add({
      entity_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entity', // Foreign key relationship
        required: true,
        index: true,
        alias: 'entityId', // allow using "entityId" in code & queries
      },
    });
  }

  // Static helper: Model.forEntity(id)
  schema.static('forEntity', function (entityId: string | mongoose.Types.ObjectId) {
    return this.find({ entity_id: entityId });
  });

  // Fail fast if entity_id missing
  schema.pre('save', function (next) {    
    const modelName = (this as any).constructor?.modelName || 'UnknownModel';
    if (!this.get('entity_id')) {
      return next(new Error(`${modelName}: entity_id is required`));
    }
    next();
  });
} 