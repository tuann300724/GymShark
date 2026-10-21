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
import { Branch } from './branch.entity';
import { Room } from './room.entity';
import { EquipmentMaintenance } from './equipment-maintenance.entity';
import { DecimalTransformer } from '../transformers';
import { EquipmentCondition, EquipmentStatus } from '../enums';

@Entity({ name: 'equipment' })
// SQL Server unique index chi cho phep 1 NULL — serialNumber nullable+unique (thiet bi co the khong co serial)
// nen dung filtered index cho phep nhieu thiet bi khong co serial
@Index('UQ_equipment_serialNumber', ['serialNumber'], {
  unique: true,
  where: '"serialNumber" IS NOT NULL',
})
export class Equipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Index()
  @Column({ name: 'branchId', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.equipment, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch;

  @Index()
  @Column({ name: 'roomId', type: 'uuid', nullable: true })
  roomId: string | null;

  @ManyToOne(() => Room, (room) => room.equipment, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'roomId' })
  room: Room | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'serialNumber' })
  serialNumber: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'purchaseDate' })
  purchaseDate: Date | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'purchasePrice',
    transformer: DecimalTransformer,
  })
  purchasePrice: number | null;

  @Column({ type: 'timestamp', nullable: true, name: 'warrantyExpiry' })
  warrantyExpiry: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: EquipmentStatus.AVAILABLE })
  status: EquipmentStatus;

  @Column({ type: 'varchar', length: 20, default: EquipmentCondition.GOOD })
  condition: EquipmentCondition;

  @Column({ type: 'timestamp', nullable: true, name: 'lastMaintenanceAt' })
  lastMaintenanceAt: Date | null;

  @Index()
  @Column({ type: 'timestamp', nullable: true, name: 'nextMaintenanceAt' })
  nextMaintenanceAt: Date | null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => EquipmentMaintenance, (m) => m.equipment)
  maintenances: EquipmentMaintenance[];
}
