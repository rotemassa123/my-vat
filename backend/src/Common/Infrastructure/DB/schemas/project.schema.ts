import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {HydratedDocument, Types} from 'mongoose';
import {AutoMap} from '@automapper/classes';
import {ProjectStatus} from "src/Common/consts/status";

export type ProjectDocument = HydratedDocument<Project>;

@Schema()
export class Project {
    @AutoMap()
    @Prop({ required: true, immutable: true })
    address: string;

    @AutoMap()
    @Prop({ required: true, enum: ProjectStatus })
    status: ProjectStatus;

    @AutoMap()
    @Prop()
    info: string;

    @AutoMap()
    @Prop({ type: [{ type: Types.ObjectId, ref: 'stages' }] })
    stages: Types.ObjectId[];

    @AutoMap()
    @Prop({ type: [{ type: Types.ObjectId, ref: 'stages' }] })
    userIds: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
