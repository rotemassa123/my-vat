import { AccountBoundPlugin } from '../../../../Common/plugins/account-bound.plugin';
import { TenantScopePlugin } from '../../../../Common/plugins/tenant-scope.plugin';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserType } from 'src/Common/consts/userType';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  hashedPassword: string;

  @Prop({ required: true, enum: UserType })
  userType: UserType;

  @Prop({ enum: ['active', 'inactive', 'pending'], default: 'pending' })
  status: string;

  @Prop()
  last_login?: Date;

  @Prop()
  profile_image_url?: string;

  @Prop()
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(AccountBoundPlugin);
UserSchema.plugin(TenantScopePlugin); 