import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';
import { Member } from './member.entity';
import { Equipment } from './equipment.entity';
import { CheckIn } from './checkin.entity';
import { TrainingSchedule } from './training-schedule.entity';

@Entity({ name: 'branches' })
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  openingTime: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  closingTime: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  openingHours: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Room, (room) => room.branch)
  rooms: Room[];

  @OneToMany(() => User, (user) => user.branch)
  users: User[];

  @OneToMany(() => Member, (member) => member.branch)
  members: Member[];

  @OneToMany(() => Equipment, (equipment) => equipment.branch)
  equipment: Equipment[];

  @OneToMany(() => CheckIn, (checkIn) => checkIn.branch)
  checkIns: CheckIn[];

  @OneToMany(() => TrainingSchedule, (schedule) => schedule.branch)
  schedules: TrainingSchedule[];
}
