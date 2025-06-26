import { AutoMap } from '@automapper/classes';
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('userTypes')
export class UserTypeEntity {
    @AutoMap()
    @PrimaryColumn()
    public userTypeId: number;

    @AutoMap()
    @Column()
    public name: string;
}
