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
import { Branch } from './branch.entity';
import { CheckInMethod, CheckInStatus } from '../enums';

@Entity({ name: 'check_ins' })
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.checkIns, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ name: 'branchId', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.checkIns, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column({ type: 'timestamp', nullable: true, name: 'checkInTime' })
  checkInTime: Date | null;

  @Column({ type: 'timestamp', nullable: true, name: 'checkOutTime' })
  checkOutTime: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: CheckInStatus.CHECKED_IN })
  status: CheckInStatus;

  @Column({ type: 'varchar', length: 20, default: CheckInMethod.MANUAL })
  method: CheckInMethod;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
