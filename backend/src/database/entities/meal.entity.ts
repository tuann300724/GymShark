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
import { MealPlan } from './meal-plan.entity';
import { MealItem } from './meal-item.entity';
import { MealType } from '../enums';

@Entity({ name: 'meals' })
export class Meal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'mealPlanId', type: 'uuid' })
  mealPlanId: string;

  @ManyToOne(() => MealPlan, (mealPlan) => mealPlan.meals, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'mealPlanId' })
  mealPlan: MealPlan;

  @Column({ type: 'varchar', length: 20 })
  type: MealType;

  @Column({ type: 'int', nullable: true, name: 'dayIndex' })
  dayIndex: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  time: string | null;

  @Column({ type: 'nvarchar', length: 1000, nullable: true })
  note: string | null;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'imageData' })
  imageData: string | null;

  @Column({ type: 'float', default: 0, name: 'totalCalories' })
  totalCalories: number;

  @Column({ type: 'float', default: 0, name: 'totalProtein' })
  totalProtein: number;

  @Column({ type: 'float', default: 0, name: 'totalCarbs' })
  totalCarbs: number;

  @Column({ type: 'float', default: 0, name: 'totalFat' })
  totalFat: number;

  @Column({ type: 'int', default: 0, name: 'orderIndex' })
  orderIndex: number;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => MealItem, (item) => item.meal)
  items: MealItem[];
}
