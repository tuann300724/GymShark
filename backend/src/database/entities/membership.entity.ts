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
import { Member } from './member.entity';
import { MembershipPackage } from './membership-package.entity';
import { Payment } from './payment.entity';
import { Invoice } from './invoice.entity';
import { DecimalTransformer } from '../transformers';
import { MembershipStatus } from '../enums';

@Entity({ name: 'memberships' })
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.memberships, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ name: 'packageId', type: 'uuid' })
  packageId: string;

  @ManyToOne(() => MembershipPackage, (pkg) => pkg.memberships, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'packageId' })
  package: MembershipPackage;

  @Column({ type: 'timestamp', name: 'startDate' })
  startDate: Date;

  @Index()
  @Column({ type: 'timestamp', name: 'endDate' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  price: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'discountAmount',
    transformer: DecimalTransformer,
  })
  discountAmount: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'finalAmount',
    transformer: DecimalTransformer,
  })
  finalAmount: number | null;

  @Column({ type: 'int', nullable: true, name: 'remainingSessions' })
  remainingSessions: number | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: MembershipStatus.ACTIVE })
  status: MembershipStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.membership)
  payments: Payment[];

  @OneToMany(() => Invoice, (invoice) => invoice.membership)
  invoices: Invoice[];
}
