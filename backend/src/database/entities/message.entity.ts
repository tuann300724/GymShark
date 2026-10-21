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
import { Conversation } from './conversation.entity';
import { User } from './user.entity';
import { MealPlan } from './meal-plan.entity';
import { MessageAttachment } from './message-attachment.entity';
import { MessageType } from '../enums';

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'conversationId', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation;

  @Index()
  @Column({ name: 'senderId', type: 'uuid' })
  senderId: string;

  // NO ACTION (không CASCADE theo người gửi) — nếu CASCADE thì xóa user (trainer)
  // sẽ tạo 2 đường cascade cùng xóa `messages` (user→messages và
  // user→trainers→conversations→messages), SQL Server chặn (multiple cascade paths).
  // Messages thuộc về Conversation: khi xóa conversation vẫn cascade xóa messages qua conversationId.
  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'varchar', length: 20, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'nvarchar', length: 4000, nullable: true })
  content: string | null;

  @Index()
  @Column({ name: 'mealPlanId', type: 'uuid', nullable: true })
  mealPlanId: string | null;

  @ManyToOne(() => MealPlan, (mealPlan) => mealPlan.messages, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: MealPlan | null;

  @Column({ type: 'bit', default: false, name: 'isRead' })
  isRead: boolean;

  @Column({ type: 'datetime2', nullable: true, name: 'readAt' })
  readAt: Date | null;

  @Column({ type: 'datetime2', nullable: true, name: 'editedAt' })
  editedAt: Date | null;

  @Index()
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message)
  attachments: MessageAttachment[];
}
