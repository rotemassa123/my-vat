import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Account {
  @Prop({ enum: ['individual', 'business'], default: 'individual' })
  account_type: string;

  @Prop({ enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: string;

  @Prop()
  company_name?: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account); 