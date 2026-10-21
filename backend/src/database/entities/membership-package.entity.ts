import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Membership } from './membership.entity';
import { JsonTransformer, DecimalTransformer } from '../transformers';
import { PackageType } from '../enums';

@Entity({ name: 'membership_packages' })
export class MembershipPackage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  description: string | null;

  // features Json? — lưu JSON trong nvarchar(max)
  @Column({ type: 'nvarchar', length: 'max', nullable: true, transformer: JsonTransformer })
  features: any | null;

  @Column({ type: 'int', name: 'durationDays' })
  durationDays: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: DecimalTransformer,
  })
  price: number;

  @Column({ type: 'int', nullable: true })
  sessions: number | null;

  @Column({ type: 'varchar', length: 20, default: PackageType.FIXED_TERM })
  type: PackageType;

  @Index()
  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status: string;

  // allowedBranches Json? — null/[] = GLOBAL
  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'allowedBranches', transformer: JsonTransformer })
  allowedBranches: string[] | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Membership, (membership) => membership.package)
  memberships: Membership[];
}
