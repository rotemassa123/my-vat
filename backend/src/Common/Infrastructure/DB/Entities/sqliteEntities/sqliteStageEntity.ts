import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { StageStatus } from 'src/Common/consts/status';
import { SqliteProjectEntity } from 'src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteProjectEntity';
import {SqliteStepEntity} from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteStepEntity";

@Entity('stages')
export class SqliteStageEntity {
    @AutoMap()
    @PrimaryGeneratedColumn()
    public id: number;

    @AutoMap()
    @Column({ type: 'varchar', length: 255, nullable: false })
    public name: string;

    @AutoMap()
    @Column({ type: 'text', enum: StageStatus, nullable: false })
    public status: StageStatus;

    @AutoMap()
    @Column({ type: 'text', nullable: true })
    public info: string;

    @AutoMap()
    @ManyToOne(() => SqliteProjectEntity, project => project.stages)
    @JoinColumn({ name: 'projectId' })
    public project: SqliteProjectEntity;

    @AutoMap()
    @OneToMany(() => SqliteStepEntity, step => step.stage)
    public steps: SqliteStepEntity[];
}

