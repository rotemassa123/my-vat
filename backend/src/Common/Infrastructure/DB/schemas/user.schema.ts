import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { AccountScopePlugin } from '../../../../Common/plugins/account-scope.plugin';
import mongoose, { Types } from 'mongoose';
import { UserRole } from 'src/Common/consts/userRole';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class User {
  // account_id field will be added by AccountScopePlugin as optional

  @Prop({ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Entity',
    required: false,
    index: true,
    alias: 'entityId'
  })
  entity_id?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  full_name?: string;

  @Prop({ required: false }) // Optional for pending users (invitations) - will be set when user completes signup
  hashed_password?: string;

  @Prop({ enum: UserRole, type: String, default: UserRole.MEMBER })
  role: UserRole;

  @Prop({ enum: ['active', 'inactive', 'pending', 'failed to send request'], default: 'pending' })
  status: string;

  @Prop()
  last_login_at?: Date;

  @Prop()
  profile_image_url?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Apply account scope plugin with optional field
UserSchema.plugin(AccountScopePlugin, { is_required: false });

UserSchema.static('forEntity', function (entityId: string | mongoose.Types.ObjectId) {
  return this.find({ entity_id: entityId });
});
