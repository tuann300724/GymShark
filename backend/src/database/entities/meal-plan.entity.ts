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
import { Trainer } from './trainer.entity';
import { Member } from './member.entity';
import { Meal } from './meal.entity';
import { Message } from './message.entity';
import { MealPlanScope, MealPlanStatus } from '../enums';

@Entity({ name: 'meal_plans' })
export class MealPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'trainerId', type: 'uuid' })
  trainerId: string;

  @ManyToOne(() => Trainer, (trainer) => trainer.mealPlans, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @Index()
  @Column({ name: 'memberId', type: 'uuid', nullable: true })
  memberId: string | null;

  @ManyToOne(() => Member, (member) => member.mealPlans, {
    onDelete: 'NO ACTION',
    nullable: true,
  })
  @JoinColumn({ name: 'memberId' })
  member: Member | null;

  @Column({ type: 'nvarchar', length: 255 })
  title: string;

  @Column({ type: 'nvarchar', length: 2000, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, default: MealPlanScope.DAY })
  scope: MealPlanScope;

  @Column({ type: 'datetime2', nullable: true, name: 'startDate' })
  startDate: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 20, default: MealPlanStatus.SENT })
  status: MealPlanStatus;

  @Index()
  @Column({ type: 'bit', default: false, name: 'isTemplate' })
  isTemplate: boolean;

  @Column({ type: 'nvarchar', length: 255, nullable: true, name: 'templateName' })
  templateName: string | null;

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

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'datetime2', nullable: true, name: 'confirmedAt' })
  confirmedAt: Date | null;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt: Date;

  @OneToMany(() => Meal, (meal) => meal.mealPlan)
  meals: Meal[];

  @OneToMany(() => Message, (message) => message.mealPlan)
  messages: Message[];
}
