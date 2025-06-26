import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';
import { UserType } from 'src/Common/consts/userType';
import {AutoMap} from '@automapper/classes';


export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
    @AutoMap()
    @Prop({ required: true, immutable: true })
    userId: number;

    @AutoMap()
    @Prop({ required: true })
    fullName: string;

    @AutoMap()
    @Prop({ required: true })
    password: string;

    @AutoMap()
    @Prop({ required: true, enum: UserType })
    userType: UserType;

    @AutoMap()
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Project' }] })
    projects: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
