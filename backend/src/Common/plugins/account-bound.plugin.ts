import { Schema } from 'mongoose';
import mongoose from 'mongoose';
// No explicit HookNextFunction import to stay compatible across mongoose versions

/**
 * AccountBoundPlugin
 * -------------------
 * Adds a mandatory, indexed `account_id` field to any schema and guarantees
 * it is present before the document is persisted.  Attach it to every
 * tenant-scoped collection (invoices, entities, …).  The `accounts` collection
 * itself should NOT use this plugin.
 *
 * Usage:
 *   const InvoiceSchema = new Schema({...});
 *   InvoiceSchema.plugin(AccountBoundPlugin);
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function AccountBoundPlugin(schema: Schema) {
  // Add the column only if it does not already exist to prevent duplicate definitions
  if (!schema.path('account_id')) {
    schema.add({
      account_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account', // Foreign key relationship
        required: true,
        index: true,
        alias: 'accountId', // allow using "accountId" in code & queries
      },
    });
  }

  // Static helper: Model.forAccount(id)
  schema.static('forAccount', function (accountId: string | mongoose.Types.ObjectId) {
    return this.find({ account_id: accountId });
  });

  // Fail fast if account_id missing
  schema.pre('save', function (next) {    
    const modelName = (this as any).constructor?.modelName || 'UnknownModel';
    if (!this.get('account_id')) {
      return next(new Error(`${modelName}: account_id is required`));
    }
    next();
  });
} 