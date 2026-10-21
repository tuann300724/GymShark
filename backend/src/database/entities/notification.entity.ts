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
import { Member } from './member.entity';
import { JsonTransformer } from '../transformers';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Index()
  @Column({ name: 'memberId', type: 'uuid', nullable: true })
  memberId: string | null;

  @ManyToOne(() => Member, (member) => member.notifications, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'memberId' })
  member: Member | null;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'nvarchar', length: 2000 })
  content: string;

  @Column({ type: 'varchar', length: 30, default: 'SYSTEM' })
  type: string;

  @Index()
  @Column({ type: 'bit', default: false, name: 'isRead' })
  isRead: boolean;

  @Column({ type: 'datetime2', nullable: true, name: 'readAt' })
  readAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  link: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'referenceType' })
  referenceType: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'referenceId' })
  referenceId: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, transformer: JsonTransformer })
  data: any | null;

  @Index()
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;
}
