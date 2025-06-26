import {Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany} from 'typeorm';
import { AutoMap } from '@automapper/classes';
import { ProjectStatus } from 'src/Common/consts/status';
import {StageEntity} from "src/Common/Infrastructure/DB/Entities/stage.entity";
import {UserEntity} from "src/Common/Infrastructure/DB/Entities/user.entity";

@Entity('projects')
export class ProjectEntity {
    @AutoMap()
    @PrimaryGeneratedColumn()
    public id: number;

    @AutoMap()
    @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
    public address: string;

    @AutoMap()
    @Column({ type: 'enum', enum: ProjectStatus, nullable: false })
    public status: ProjectStatus;

    @AutoMap()
    @Column({ type: 'text', nullable: true })
    public info: string;

    @AutoMap()
    @OneToMany(() => StageEntity, stage => stage.project)
    public stages: StageEntity[];

    @AutoMap()
    @ManyToMany(() => UserEntity, user => user.projects)
    public users: UserEntity[];
}






