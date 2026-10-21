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
import { Trainer } from './trainer.entity';
import { Member } from './member.entity';
import { Notification } from './notification.entity';
import { Payment } from './payment.entity';
import { AuditLog } from './audit-log.entity';
import { Message } from './message.entity';
import { UserRole, UserStatus } from '../enums';

@Entity({ name: 'users' })
// SQL Server unique index chi cho phep 1 NULL (khac PostgreSQL cho phep nhieu NULL).
// Cac cot nullable+unique (phone, providerId) nen dung filtered index WHERE IS NOT NULL
// de van unique khi co gia tri nhung cho phep nhieu NULL.
@Index('UQ_users_phone', ['phone'], { unique: true, where: '"phone" IS NOT NULL' })
@Index('UQ_users_providerId', ['providerId'], {
  unique: true,
  where: '"providerId" IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'passwordHash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, name: 'fullName' })
  fullName: string;

  @Index()
  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: UserRole.STAFF })
  role: UserRole;

  @Column({ type: 'varchar', length: 20, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatarUrl' })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 20, default: 'LOCAL' })
  provider: string;

  @Column({ type: 'varchar', length: 64, nullable: true, name: 'providerId' })
  providerId: string | null;

  @Index()
  @Column({ name: 'branchId', type: 'uuid', nullable: true })
  branchId: string | null;

  @ManyToOne(() => Branch, (branch) => branch.users, { onDelete: 'NO ACTION', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => Trainer, (trainer) => trainer.user)
  trainer: Trainer;

  @OneToOne(() => Member, (member) => member.user)
  member: Member;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Payment, (payment) => payment.confirmedBy)
  confirmedPayments: Payment[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs: AuditLog[];

  @OneToMany(() => Message, (message) => message.sender)
  messages: Message[];
}
