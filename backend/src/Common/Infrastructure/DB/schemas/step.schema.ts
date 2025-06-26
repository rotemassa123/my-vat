import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';
import {AutoMap} from '@automapper/classes';
import {StageStatus} from "src/Common/consts/status";


export type StepDocument = HydratedDocument<Step>;

@Schema()
export class Step {
    @AutoMap()
    @Prop({ required: true, enum: StageStatus })
    status: StageStatus;

    @AutoMap()
    @Prop()
    info: string;

    @AutoMap()
    @Prop({ type: Types.ObjectId, ref: 'Step' })
    stageId: Types.ObjectId;

    @AutoMap()
    @Prop({ type: Date, required: false })
    date: Date;

}

export const StepSchema = SchemaFactory.createForClass(Step);
