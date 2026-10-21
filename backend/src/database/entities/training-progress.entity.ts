import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TrainingSchedule } from './training-schedule.entity';
import { Member } from './member.entity';
import { Trainer } from './trainer.entity';

@Entity({ name: 'training_progress' })
export class TrainingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'sessionId', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => TrainingSchedule, (session) => session.progressNotes, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSchedule;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.progressNotes, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ name: 'trainerId', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, (trainer) => trainer.progressNotes, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Column({ type: 'varchar', length: 2000 })
  note: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  performance: string | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  recommendation: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
