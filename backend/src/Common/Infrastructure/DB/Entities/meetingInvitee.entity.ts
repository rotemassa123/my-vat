import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from "typeorm";
import { AutoMap } from "@automapper/classes";
import { UserEntity } from "./user.entity";
import { MeetingEntity } from "./meeting.entity";

@Entity("meeting_invitees")
export class MeetingInviteeEntity {
  @AutoMap()
  @PrimaryGeneratedColumn()
  public id: number;

  @AutoMap()
  @ManyToOne(() => MeetingEntity, meeting => meeting.invitees)
  @JoinColumn({ name: "meetingId" })
  public meeting: MeetingEntity;

  @AutoMap()
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "userId" })
  public user: UserEntity;

  @AutoMap()
  @Column({ type: "boolean", nullable: true })
  public accepted: boolean | null;

  @AutoMap()
  @Column({ type: "timestamp", nullable: true })
  public responseTime: Date;
} 