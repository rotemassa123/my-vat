import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

export type EntityDocument = HydratedDocument<Entity>;

export interface EntityAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Entity {
  // This property is defined for TypeScript type safety; the actual schema field is created by AccountScopePlugin.
  account_id: mongoose.Types.ObjectId;

  @Prop({ enum: ['individual', 'business', 'company', 'subsidiary', 'branch', 'partnership', 'sole_proprietorship'], default: 'individual' })
  entity_type: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop()
  entity_name?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop()
  email?: string;

  @Prop({ type: Object })
  address?: EntityAddress;

  @Prop()
  phone?: string;
}

export const EntitySchema = SchemaFactory.createForClass(Entity);

EntitySchema.plugin(AccountScopePlugin); 