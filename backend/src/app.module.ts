import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { InvoicesModule } from './modules/invoices/invoices.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PublicModule } from './modules/public/public.module';
import { MemberModule } from './modules/member/member.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting toàn cục: mặc định 300 request / phút / IP.
    // Các endpoint nhạy cảm (login/register/validate mã) được đặt ngưỡng thấp hơn qua @Throttle.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 300,
      },
    ]),
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
    InvoicesModule,
    SchedulesModule,
    PromotionsModule,
    EquipmentModule,
    NotificationsModule,
    ReportsModule,
    PublicModule,
    MemberModule,
    AuditLogsModule,
  ],
  providers: [
    // Rate limiting: áp dụng cho mọi request
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Thống nhất format lỗi, không lộ stack trace / thông tin nội bộ
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
