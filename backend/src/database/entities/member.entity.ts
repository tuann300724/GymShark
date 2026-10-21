import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';
import { Membership } from './membership.entity';
import { Payment } from './payment.entity';
import { CheckIn } from './checkin.entity';
import { TrainingSchedule } from './training-schedule.entity';
import { TrainerMember } from './trainer-member.entity';
import { TrainingProgress } from './training-progress.entity';
import { Invoice } from './invoice.entity';
import { FaceEmbedding } from './face-embedding.entity';
import { Conversation } from './conversation.entity';
import { MealPlan } from './meal-plan.entity';
import { Notification } from './notification.entity';
import { Gender, MemberStatus } from '../enums';

@Entity({ name: 'members' })
// SQL Server unique index chi cho phep 1 NULL — userId nullable+unique nen dung filtered index
@Index('UQ_members_userId', ['userId'], { unique: true, where: '"userId" IS NOT NULL' })
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Index()
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;

  @OneToOne(() => User, (user) => user.member, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ type: 'varchar', length: 255, name: 'fullName' })
  fullName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 10, default: Gender.MALE })
  gender: Gender;

  @Column({ type: 'timestamp', nullable: true, name: 'dateOfBirth' })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatarUrl' })
  avatarUrl: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: MemberStatus.ACTIVE })
  status: MemberStatus;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'emergencyContact' })
  emergencyContact: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'joinedAt' })
  joinedAt: Date | null;

  @Index()
  @Column({ name: 'branchId', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.members, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Membership, (membership) => membership.member)
  memberships: Membership[];

  @OneToMany(() => Payment, (payment) => payment.member)
  payments: Payment[];

  @OneToMany(() => CheckIn, (checkIn) => checkIn.member)
  checkIns: CheckIn[];

  @OneToMany(() => TrainingSchedule, (schedule) => schedule.member)
  schedules: TrainingSchedule[];

  @OneToMany(() => TrainerMember, (trainerMember) => trainerMember.member)
  trainerMembers: TrainerMember[];

  @OneToMany(() => TrainingProgress, (progress) => progress.member)
  progressNotes: TrainingProgress[];

  @OneToMany(() => Invoice, (invoice) => invoice.member)
  invoices: Invoice[];

  @OneToMany(() => FaceEmbedding, (face) => face.member)
  faceEmbeddings: FaceEmbedding[];

  @OneToMany(() => Conversation, (conversation) => conversation.member)
  conversations: Conversation[];

  @OneToMany(() => MealPlan, (mealPlan) => mealPlan.member)
  mealPlans: MealPlan[];

  @OneToMany(() => Notification, (notification) => notification.member)
  notifications: Notification[];
}
