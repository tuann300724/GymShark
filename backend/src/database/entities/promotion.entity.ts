import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { DecimalTransformer } from '../transformers';
import { DiscountType } from '../enums';

@Entity({ name: 'promotions' })
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: DiscountType.PERCENTAGE, name: 'discountType' })
  discountType: DiscountType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'discountValue',
    transformer: DecimalTransformer,
  })
  discountValue: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'minOrderValue',
    transformer: DecimalTransformer,
  })
  minOrderValue: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'maxDiscount',
    transformer: DecimalTransformer,
  })
  maxDiscount: number | null;

  @Column({ type: 'datetime2', name: 'startDate' })
  startDate: Date;

  @Index()
  @Column({ type: 'datetime2', name: 'endDate' })
  endDate: Date;

  @Column({ type: 'int', nullable: true, name: 'usageLimit' })
  usageLimit: number | null;

  @Column({ type: 'int', nullable: true, name: 'perMemberLimit' })
  perMemberLimit: number | null;

  @Column({ type: 'int', default: 0, name: 'usedCount' })
  usedCount: number;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.promotion)
  payments: Payment[];
}
