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
import { Message } from './message.entity';
import { ConversationStatus } from '../enums';

@Entity({ name: 'conversations' })
@Index('UQ_conversations_trainer_member', ['trainerId', 'memberId'], { unique: true })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trainerId', type: 'uuid' })
  trainerId: string;

  // NO ACTION — conversations có 2 cha cascade (trainers + members) và 1 con cascade
  // (messages): cả 3 cộng CASCADE sẽ vi phạm "multiple cascade paths" của SQL Server
  // (error 1785) — khác PostgreSQL nên trước đây Prisma chạy êm. App không bao giờ
  // hard-delete trainer (không có trainer.delete trong service) nên NO ACTION an toàn;
  // khi xóa conversation vẫn cascade xóa messages qua conversationId.
  @ManyToOne(() => Trainer, (trainer) => trainer.conversations, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  // NO ACTION — xem lý do ở trainerId phía trên (app không hard-delete member).
  @ManyToOne(() => Member, (member) => member.conversations, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ type: 'varchar', length: 20, default: ConversationStatus.ACTIVE })
  status: ConversationStatus;

  @Index()
  @Column({ type: 'datetime2', nullable: true, name: 'lastMessageAt' })
  lastMessageAt: Date | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true, name: 'lastMessagePreview' })
  lastMessagePreview: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'lastSenderRole' })
  lastSenderRole: string | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];
}
