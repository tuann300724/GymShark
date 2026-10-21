import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from './message.entity';

@Entity({ name: 'message_attachments' })
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'messageId', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => Message, (message) => message.attachments, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'messageId' })
  message: Message;

  @Column({ type: 'varchar', length: 20, default: 'IMAGE' })
  kind: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'fileName' })
  fileName: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mimeType' })
  mimeType: string | null;

  @Column({ type: 'int', nullable: true, name: 'sizeBytes' })
  sizeBytes: number | null;

  @Column({ type: 'varchar', nullable: true, name: 'dataUrl' })
  dataUrl: string;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
