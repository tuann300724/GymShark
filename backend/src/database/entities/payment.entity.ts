import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';
import { Membership } from './membership.entity';
import { Promotion } from './promotion.entity';
import { User } from './user.entity';
import { Invoice } from './invoice.entity';
import { DecimalTransformer } from '../transformers';
import { PaymentMethod, PaymentStatus } from '../enums';

@Entity({ name: 'payments' })
// SQL Server unique index chi cho phep 1 NULL — transactionRef nullable+unique (chi bank transfer co)
// nen dung filtered index cho phep nhieu payment khong co transactionRef
@Index('UQ_payments_transactionRef', ['transactionRef'], {
  unique: true,
  where: '"transactionRef" IS NOT NULL',
})
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.payments, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ name: 'membershipId', type: 'uuid', nullable: true })
  membershipId: string | null;

  @ManyToOne(() => Membership, (membership) => membership.payments, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership | null;

  @Index()
  @Column({ name: 'promotionId', type: 'uuid', nullable: true })
  promotionId: string | null;

  @ManyToOne(() => Promotion, (promotion) => promotion.payments, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'promotionId' })
  promotion: Promotion | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'discountAmount',
    transformer: DecimalTransformer,
  })
  discountAmount: number | null;

  @Column({ type: 'varchar', length: 10, default: 'VND' })
  currency: string;

  @Column({ type: 'varchar', length: 20, default: PaymentMethod.CASH })
  method: PaymentMethod;

  @Index()
  @Column({ type: 'varchar', length: 20, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'transactionRef' })
  transactionRef: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  notes: string | null;

  @Column({ name: 'confirmedById', type: 'uuid', nullable: true })
  confirmedById: string | null;

  @ManyToOne(() => User, (user) => user.confirmedPayments, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'confirmedById' })
  confirmedBy: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'confirmedAt' })
  confirmedAt: Date | null;

  @Index()
  @Column({ type: 'timestamp', nullable: true, name: 'paidAt' })
  paidAt: Date | null;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToOne(() => Invoice, (invoice) => invoice.payment)
  invoice: Invoice;
}
