import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TrainingSchedule } from './training-schedule.entity';
import { TrainerMember } from './trainer-member.entity';
import { TrainingProgress } from './training-progress.entity';
import { Conversation } from './conversation.entity';
import { MealPlan } from './meal-plan.entity';
import { DecimalTransformer } from '../transformers';
import { Gender, TrainerStatus } from '../enums';

@Entity({ name: 'trainers' })
export class Trainer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'userId', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.trainer, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Index()
  @Column({ type: 'nvarchar', length: 255 })
  specialization: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  certification: string | null;

  @Column({ type: 'int', default: 1, name: 'experienceYears' })
  experienceYears: number;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: Gender | null;

  @Column({ type: 'datetime2', nullable: true, name: 'dateOfBirth' })
  dateOfBirth: Date | null;

  @Column({ type: 'float', default: 5.0 })
  rating: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'hourlyRate',
    transformer: DecimalTransformer,
  })
  hourlyRate: number | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: TrainerStatus.ACTIVE })
  status: TrainerStatus;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => TrainingSchedule, (schedule) => schedule.trainer)
  schedules: TrainingSchedule[];

  @OneToMany(() => TrainerMember, (trainerMember) => trainerMember.trainer)
  trainerMembers: TrainerMember[];

  @OneToMany(() => TrainingProgress, (progress) => progress.trainer)
  progressNotes: TrainingProgress[];

  @OneToMany(() => Conversation, (conversation) => conversation.trainer)
  conversations: Conversation[];

  @OneToMany(() => MealPlan, (mealPlan) => mealPlan.trainer)
  mealPlans: MealPlan[];
}
