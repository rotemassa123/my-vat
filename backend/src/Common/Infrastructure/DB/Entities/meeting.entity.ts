import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { UserEntity } from "./user.entity";
import { ProjectEntity } from "./project.entity";
import { StepEntity } from "./step.entity";
import { MeetingInviteeEntity } from "./meetingInvitee.entity";

export enum MeetingType {
  VIRTUAL = "virtual",
  PHYSICAL = "physical",
}

@Entity("meetings")
export class MeetingEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  public id: number;

  @AutoMap()
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "meetingOwnerId" })
  public meetingOwner: UserEntity;

  @AutoMap()
  @Column({ type: "timestamp" })
  public startTime: Date;

  @AutoMap()
  @Column({ type: "timestamp" })
  public endTime: Date;

  @AutoMap()
  @Column({ type: "enum", enum: MeetingType })
  public type: MeetingType;

  @AutoMap()
  @Column({ type: "varchar", length: 255, nullable: true })
  public location?: string;

  @AutoMap()
  @Column({ type: "text", nullable: true })
  public extraData?: string;

  @AutoMap()
  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: "projectId" })
  public project?: ProjectEntity;

  @AutoMap()
  @ManyToOne(() => StepEntity, { nullable: true })
  @JoinColumn({ name: "stepId" })
  public step?: StepEntity;

  @AutoMap()
  @OneToMany(() => MeetingInviteeEntity, invitee => invitee.meeting)
  public invitees: MeetingInviteeEntity[];
} 