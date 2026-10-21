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
import { Equipment } from './equipment.entity';
import { DecimalTransformer } from '../transformers';
import { MaintenanceStatus, MaintenanceType } from '../enums';

@Entity({ name: 'equipment_maintenances' })
export class EquipmentMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'equipmentId', type: 'uuid' })
  equipmentId: string;

  @ManyToOne(() => Equipment, (equipment) => equipment.maintenances, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'equipmentId' })
  equipment: Equipment;

  @Column({ type: 'varchar', length: 20, default: MaintenanceType.ROUTINE })
  type: MaintenanceType;

  @Index()
  @Column({ type: 'timestamp', nullable: true, name: 'maintenanceDate' })
  maintenanceDate: Date | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: DecimalTransformer,
  })
  cost: number | null;

  @Column({ type: 'varchar', length: 2000 })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'performedBy' })
  performedBy: string | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: MaintenanceStatus.COMPLETED })
  status: MaintenanceStatus;

  @Column({ type: 'timestamp', nullable: true, name: 'nextDueDate' })
  nextDueDate: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
