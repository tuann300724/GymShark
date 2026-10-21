import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'password_resets' })
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'codeHash' })
  codeHash: string;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Index()
  @Column({ type: 'timestamp', name: 'expiresAt' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'lastSentAt', default: () => 'CURRENT_TIMESTAMP' })
  lastSentAt: Date | null;
  // Prisma có @default(now()) — đồng bộ default 2 phía, tránh NULL khi INSERT quên truyền.

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
