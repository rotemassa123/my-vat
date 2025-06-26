import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { AutoMap } from '@automapper/classes';
import { StageStatus } from "src/Common/consts/status";

export type StageDocument = HydratedDocument<Stage>;

@Schema()
export class Stage {
    @AutoMap()
    @Prop({ required: true })
    name: string;

    @AutoMap()
    @Prop({ required: true, enum: StageStatus })
    status: StageStatus;

    @AutoMap()
    @Prop()
    info: string;

    @AutoMap()
    @Prop({ type: [{ type: Types.ObjectId, ref: 'Step' }] })
    steps: Types.ObjectId[];

    @AutoMap()
    @Prop({ type: Types.ObjectId, ref: 'Step' })
    projectId: Types.ObjectId;
}

export const StageSchema = SchemaFactory.createForClass(Stage);
