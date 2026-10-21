import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';

// Nạp .env khi chạy standalone (CLI synchronize / seed) — NestJS tự nạp qua ConfigModule.
dotenvConfig({ path: __dirname + '/../.env' });

import { Branch } from './entities/branch.entity';
import { Room } from './entities/room.entity';
import { User } from './entities/user.entity';
import { Trainer } from './entities/trainer.entity';
import { Member } from './entities/member.entity';
import { EmailVerification } from './entities/email-verification.entity';
import { MembershipPackage } from './entities/membership-package.entity';
import { Membership } from './entities/membership.entity';
import { Payment } from './entities/payment.entity';
import { Invoice } from './entities/invoice.entity';
import { CheckIn } from './entities/checkin.entity';
import { FaceEmbedding } from './entities/face-embedding.entity';
import { TrainingSchedule } from './entities/training-schedule.entity';
import { TrainerMember } from './entities/trainer-member.entity';
import { TrainingProgress } from './entities/training-progress.entity';
import { Promotion } from './entities/promotion.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Equipment } from './entities/equipment.entity';
import { EquipmentMaintenance } from './entities/equipment-maintenance.entity';
import { Notification } from './entities/notification.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { Food } from './entities/food.entity';
import { MealPlan } from './entities/meal-plan.entity';
import { Meal } from './entities/meal.entity';
import { MealItem } from './entities/meal-item.entity';

export const allEntities = [
  Branch,
  Room,
  User,
  Trainer,
  Member,
  EmailVerification,
  MembershipPackage,
  Membership,
  Payment,
  Invoice,
  CheckIn,
  FaceEmbedding,
  TrainingSchedule,
  TrainerMember,
  TrainingProgress,
  Promotion,
  AuditLog,
  Equipment,
  EquipmentMaintenance,
  Notification,
  PasswordReset,
  Conversation,
  Message,
  MessageAttachment,
  Food,
  MealPlan,
  Meal,
  MealItem,
];

/** Cấu hình TypeORM cho SQL Server — đọc env giống Prisma (host/port/user/pass/db). */
export function buildDataSourceOptions() {
  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'gym_db',
    options: {
      encrypt: false,
    },
    // Trong dev giữ synchronize; sẽ tắt khi chuyển sang migration ở Phase 3.
    synchronize: process.env.DB_SYNCHRONIZE !== 'false',
    logging: process.env.DB_LOGGING === 'true',
    entities: allEntities,
  };
}

// DataSource standalone cho CLI (typeorm CLI / ts-node).
export const AppDataSource = new DataSource(buildDataSourceOptions());
