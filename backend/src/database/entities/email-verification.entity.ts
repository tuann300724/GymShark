import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Gender } from '../enums';

@Entity({ name: 'email_verifications' })
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'nvarchar', length: 255, name: 'fullName' })
  fullName: string;

  @Column({ type: 'varchar', length: 30 })
  phone: string;

  @Column({ type: 'varchar', length: 255, name: 'passwordHash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, name: 'codeHash' })
  codeHash: string;

  @Column({ type: 'varchar', length: 10, default: Gender.MALE })
  gender: Gender;

  @Column({ type: 'datetime2', nullable: true, name: 'dateOfBirth' })
  dateOfBirth: Date | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'nvarchar', length: 255, nullable: true, name: 'emergencyContact' })
  emergencyContact: string | null;

  @Column({ name: 'branchId', type: 'uuid', nullable: true })
  branchId: string | null;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Index()
  @Column({ type: 'datetime2', name: 'expiresAt' })
  expiresAt: Date;

  @Index()
  @Column({ type: 'datetime2', nullable: true, name: 'lastSentAt', default: () => 'SYSUTCDATETIME()' })
  lastSentAt: Date | null;
  // Prisma có @default(now()) — TypeORM cũng cần default, nếu không INSERT quên truyền
  // sẽ NULL và luồng resend đọc .getTime() bị crash. Đồng bộ 2 phía.

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
