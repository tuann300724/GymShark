import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { FloatArrayTransformer } from '../transformers';

@Entity({ name: 'face_embeddings' })
export class FaceEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.faceEmbeddings, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  // Float[] (vector embedding 1024 chiều) -> nvarchar(max) JSON (~10k ký tự)
  @Column({ type: 'varchar', nullable: true, transformer: FloatArrayTransformer })
  embedding: number[] | null;

  // Ảnh khuôn mặt tham chiếu (data URL JPEG base64, hàng trăm KB) — chỉ có ở mẫu đầu tiên
  @Column({ type: 'varchar', nullable: true, name: 'imageData' })
  imageData: string | null;

  @Column({ type: 'timestamp', name: 'consentAt' })
  consentAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
