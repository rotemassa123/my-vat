import { AutoMap } from "@automapper/classes";
import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { UserTypeEntity } from "src/Common/Infrastructure/DB/Entities/userTypes.entity";
import {SqliteProjectEntity} from "src/Common/Infrastructure/DB/Entities/sqliteEntities/sqliteProjectEntity";

@Entity("users")
export class SqliteUserEntity {
  @AutoMap()
  @PrimaryColumn()
  public userId: number;

  @AutoMap()
  @Column()
  public fullName: string;

  @AutoMap()
  @Column()
  public password: string;

  @AutoMap()
  @Column({ nullable: true })
  public profileImageUrl?: string;

  @AutoMap()
  @ManyToOne(() => UserTypeEntity)
  @JoinColumn({ name: "userTypeId" })
  public userType: UserTypeEntity;

  @AutoMap()
  @ManyToMany(() => SqliteProjectEntity, (project) => project.users)
  @JoinTable({ name: "user_projects" })
  public projects: SqliteProjectEntity[];
}
