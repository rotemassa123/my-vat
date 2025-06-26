import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { ProjectStatus } from 'src/Common/consts/status';
import {SqliteStageEntity} from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteStageEntity";
import {SqliteUserEntity} from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteUserEntity";

@Entity('projects')
export class SqliteProjectEntity {
    @AutoMap()
    @PrimaryGeneratedColumn()
    public id: number;

    @AutoMap()
    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    public address: string;

    @AutoMap()
    @Column({ type: 'text', enum: ProjectStatus, nullable: false })
    public status: ProjectStatus;

    @AutoMap()
    @Column({ type: 'text', nullable: true })
    public info: string;

    @AutoMap()
    @OneToMany(() => SqliteStageEntity, stage => stage.project)
    public stages: SqliteStageEntity[];

    @AutoMap()
    @ManyToMany(() => SqliteUserEntity, user => user.projects)
    public users: SqliteUserEntity[];
}






