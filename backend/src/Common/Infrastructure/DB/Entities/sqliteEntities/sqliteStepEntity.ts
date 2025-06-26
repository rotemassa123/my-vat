import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { SqliteStageEntity } from 'src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteStageEntity';
import {StepStatus} from 'src/Common/consts/status';

@Entity('steps')
export class SqliteStepEntity {
    @AutoMap()
    @PrimaryGeneratedColumn()
    public id: number;

    @AutoMap()
    @Column({ type: 'text', enum: StepStatus, nullable: false })
    public status: StepStatus;

    @AutoMap()
    @Column({ type: 'text', nullable: true })
    public info: string;

    @AutoMap()
    @ManyToOne(() => SqliteStageEntity, stage => stage.steps)
    @JoinColumn({ name: 'stageId' })
    public stage: SqliteStageEntity;
}
