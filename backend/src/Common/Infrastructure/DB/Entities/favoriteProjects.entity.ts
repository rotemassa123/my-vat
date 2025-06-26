import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ProjectEntity } from "./project.entity";

@Entity("user_favorites_projects")
export class FavoriteProjectsEntity {
  @PrimaryColumn()
  public userId: number;

  @PrimaryColumn()
  public projectId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "userId" })
  public user: UserEntity;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: "projectId" })
  public project: ProjectEntity;
}
