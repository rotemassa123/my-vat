import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { AutoMap } from "@automapper/classes";
import { StageStatus } from "src/Common/consts/status";
import { ProjectEntity } from "./project.entity";
import { StepEntity } from "src/Common/Infrastructure/DB/Entities/step.entity";

@Entity("stages")
export class StageEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  public id: number;

  @AutoMap()
  @Column({ type: "varchar", length: 255, nullable: false })
  public name: string;

  @AutoMap()
  @Column({ type: "enum", enum: StageStatus, nullable: false })
  public status: StageStatus;

  @AutoMap()
  @Column({ type: "text", nullable: true })
  public info: string;

  @AutoMap()
  @ManyToOne(() => ProjectEntity, (project) => project.stages)
  @JoinColumn({ name: "projectId" })
  public project: ProjectEntity;

  @AutoMap()
  @Column({ type: "int", default: 0, nullable: false })
  public finishedStepsCounter: number;

  @AutoMap()
  @OneToMany(() => StepEntity, (step) => step.stage)
  public steps: StepEntity[];
}
