import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MealItem } from './meal-item.entity';
import { FoodCategory } from '../enums';

@Entity({ name: 'foods' })
export class Food {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 20, default: FoodCategory.PROTEIN })
  category: FoodCategory;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'imageUrl' })
  imageUrl: string | null;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  description: string | null;

  @Column({ type: 'float', default: 100, name: 'servingSize' })
  servingSize: number;

  @Column({ type: 'varchar', length: 20, default: 'g', name: 'servingUnit' })
  servingUnit: string;

  @Column({ type: 'float', default: 0, name: 'caloriesPer100g' })
  caloriesPer100g: number;

  @Column({ type: 'float', default: 0, name: 'proteinPer100g' })
  proteinPer100g: number;

  @Column({ type: 'float', default: 0, name: 'carbsPer100g' })
  carbsPer100g: number;

  @Column({ type: 'float', default: 0, name: 'fatPer100g' })
  fatPer100g: number;

  @Index()
  @Column({ type: 'bit', default: true, name: 'isActive' })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true, name: 'createdById' })
  createdById: string | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => MealItem, (item) => item.food)
  items: MealItem[];
}
