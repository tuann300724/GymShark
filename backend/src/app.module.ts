import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { MembersModule } from './modules/members/members.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { BranchesModule } from './modules/branches/branches.module';
import { PackagesModule } from './modules/packages/packages.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PublicModule } from './modules/public/public.module';
import { MemberModule } from './modules/member/member.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembersModule,
    TrainersModule,
    BranchesModule,
    PackagesModule,
    MembershipsModule,
    CheckinsModule,
    PaymentsModule,
    SchedulesModule,
    PromotionsModule,
    EquipmentModule,
    NotificationsModule,
    ReportsModule,
    PublicModule,
    MemberModule,
  ],
})
export class AppModule {}
