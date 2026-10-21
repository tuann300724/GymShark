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
import { Trainer } from './trainer.entity';
import { Member } from './member.entity';
import { Branch } from './branch.entity';
import { Room } from './room.entity';
import { TrainingProgress } from './training-progress.entity';
import { ScheduleStatus, SessionType } from '../enums';

@Entity({ name: 'training_schedules' })
export class TrainingSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Index()
  @Column({ name: 'trainerId', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, (trainer) => trainer.schedules, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Index()
  @Column({ name: 'memberId', type: 'uuid', nullable: true })
  memberId: string | null;

  @ManyToOne(() => Member, (member) => member.schedules, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'memberId' })
  member: Member | null;

  @Index()
  @Column({ name: 'branchId', type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, (branch) => branch.schedules, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  @Index()
  @Column({ name: 'roomId', type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, (room) => room.schedules, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'roomId' })
  room: Room | null;

  @Index()
  @Column({ type: 'varchar', length: 30, default: SessionType.PERSONAL_TRAINING })
  type: SessionType;

  @Index()
  @Column({ type: 'datetime2', name: 'startTime' })
  startTime: Date;

  @Index()
  @Column({ type: 'datetime2', name: 'endTime' })
  endTime: Date;

  @Index()
  @Column({ type: 'varchar', length: 20, default: ScheduleStatus.SCHEDULED })
  status: ScheduleStatus;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  description: string | null;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  notes: string | null;

  @Column({ type: 'nvarchar', length: 1000, nullable: true, name: 'cancellationNote' })
  cancellationNote: string | null;

  @Column({ type: 'datetime2', nullable: true, name: 'completedAt' })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => TrainingProgress, (progress) => progress.session)
  progressNotes: TrainingProgress[];
}
