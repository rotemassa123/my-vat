import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AutoMap } from "@automapper/classes";
import { StageEntity } from "./stage.entity";
import { StepStatus } from "src/Common/consts/status";

@Entity("steps")
export class StepEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  public id: number;

  @AutoMap()
  @Column({ type: "enum", enum: StepStatus, nullable: false })
  public status: StepStatus;

  @AutoMap()
  @Column({ type: "text", nullable: true })
  public info: string;

  @AutoMap()
  @ManyToOne(() => StageEntity, (stage) => stage.steps)
  @JoinColumn({ name: "stageId" })
  public stage: StageEntity;

  @AutoMap()
  @Column({ type: "date", nullable: true })
  public date: Date;
  
}
