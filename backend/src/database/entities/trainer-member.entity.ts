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
import { Trainer } from './trainer.entity';
import { Member } from './member.entity';
import { TrainerMemberStatus } from '../enums';

@Entity({ name: 'trainer_members' })
@Index('UQ_trainer_members_trainer_member', ['trainerId', 'memberId'])
export class TrainerMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trainerId', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, (trainer) => trainer.trainerMembers, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.trainerMembers, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Column({ type: 'datetime2', nullable: true, name: 'startDate' })
  startDate: Date | null;

  @Column({ type: 'datetime2', nullable: true, name: 'endDate' })
  endDate: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: TrainerMemberStatus.ACTIVE })
  status: TrainerMemberStatus;

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
