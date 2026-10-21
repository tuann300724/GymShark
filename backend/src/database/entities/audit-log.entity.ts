import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { JsonTransformer } from '../transformers';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.auditLogs, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  action: string;

  @Index()
  @Column({ type: 'varchar', length: 50 })
  entity: string;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'entityId' })
  entityId: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, transformer: JsonTransformer })
  metadata: any | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string | null;

  @Index()
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;
}
