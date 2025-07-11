import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserType } from 'src/Common/consts/userType';
import mongoose from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Account',
    required: false,
    index: true,
    alias: 'accountId'
  })
  account_id?: mongoose.Types.ObjectId;

  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Entity',
    required: false,
    index: true,
    alias: 'entityId'
  })
  entity_id?: mongoose.Types.ObjectId;

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

UserSchema.static('forAccount', function (accountId: string | mongoose.Types.ObjectId) {
  return this.find({ account_id: accountId });
});

UserSchema.static('forEntity', function (entityId: string | mongoose.Types.ObjectId) {
  return this.find({ entity_id: entityId });
});
