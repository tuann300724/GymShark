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
import { Payment } from './payment.entity';
import { DecimalTransformer } from '../transformers';
import { InvoiceStatus } from '../enums';

@Entity({ name: 'invoices' })
// SQL Server unique index chi cho phep 1 NULL — paymentId nullable+unique nen dung filtered index
@Index('UQ_invoices_paymentId', ['paymentId'], { unique: true, where: '"paymentId" IS NOT NULL' })
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 30, unique: true, name: 'invoiceNumber' })
  invoiceNumber: string;

  @Index()
  @Column({ name: 'memberId', type: 'uuid' })
  memberId: string;

  @ManyToOne(() => Member, (member) => member.invoices, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @Index()
  @Column({ name: 'membershipId', type: 'uuid', nullable: true })
  membershipId: string | null;

  @ManyToOne(() => Membership, (membership) => membership.invoices, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'membershipId' })
  membership: Membership | null;

  @Column({ name: 'paymentId', type: 'uuid', nullable: true })
  paymentId: string | null;

  @OneToOne(() => Payment, (payment) => payment.invoice, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    transformer: DecimalTransformer,
  })
  discount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: DecimalTransformer })
  total: number;

  @Index()
  @Column({ type: 'varchar', length: 20, default: InvoiceStatus.ISSUED })
  status: InvoiceStatus;

  @Column({ type: 'datetime2', nullable: true, name: 'issuedAt' })
  issuedAt: Date | null;

  @Column({ type: 'datetime2', nullable: true, name: 'dueDate' })
  dueDate: Date | null;

  @Index()
  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
