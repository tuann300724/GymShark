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
import { RoomsModule } from './modules/rooms/rooms.module';
import { PackagesModule } from './modules/packages/packages.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { FacesModule } from './modules/faces/faces.module';
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
import { MailModule } from './modules/mail/mail.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealPlansModule } from './modules/meal-plans/meal-plans.module';
import { ChatModule } from './modules/chat/chat.module';
import { CassoModule } from './modules/casso/casso.module';
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
    MailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MembersModule,
    TrainersModule,
    RoomsModule,
    PackagesModule,
    MembershipsModule,
    CheckinsModule,
    FacesModule,
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
    FoodsModule,
    ChatModule,
    MealPlansModule,
    CassoModule,
  ],
  providers: [
    // Rate limiting: áp dụng cho mọi request
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Thống nhất format lỗi, không lộ stack trace / thông tin nội bộ
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
