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
import { Meal } from './meal.entity';
import { Food } from './food.entity';

@Entity({ name: 'meal_items' })
export class MealItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'mealId', type: 'uuid' })
  mealId: string;

  @ManyToOne(() => Meal, (meal) => meal.items, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'mealId' })
  meal: Meal;

  @Index()
  @Column({ name: 'foodId', type: 'uuid', nullable: true })
  foodId: string | null;

  @ManyToOne(() => Food, (food) => food.items, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'foodId' })
  food: Food | null;

  @Column({ type: 'nvarchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'imageUrl' })
  imageUrl: string | null;

  @Column({ type: 'float', default: 100 })
  quantity: number;

  @Column({ type: 'varchar', length: 20, default: 'g' })
  unit: string;

  @Column({ type: 'float', default: 0 })
  calories: number;

  @Column({ type: 'float', default: 0 })
  protein: number;

  @Column({ type: 'float', default: 0 })
  carbs: number;

  @Column({ type: 'float', default: 0 })
  fat: number;

  @Column({ type: 'int', default: 0, name: 'orderIndex' })
  orderIndex: number;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;
}
