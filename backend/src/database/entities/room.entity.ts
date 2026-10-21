import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Equipment } from './equipment.entity';
import { TrainingSchedule } from './training-schedule.entity';

@Entity({ name: 'rooms' })
@Index('UQ_rooms_branch_code', ['branchId', 'code'], { unique: true })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branchId', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.rooms, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 30, default: 'GYM_AREA' })
  type: string;

  @Column({ type: 'int', default: 20 })
  capacity: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  floor: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'AVAILABLE' })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Equipment, (equipment) => equipment.room)
  equipment: Equipment[];

  @OneToMany(() => TrainingSchedule, (schedule) => schedule.room)
  schedules: TrainingSchedule[];
}
