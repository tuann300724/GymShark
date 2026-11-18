import { Module } from '@nestjs/common';
import { ClassBookingsService } from './class-bookings.service';
import { ClassBookingsController } from './class-bookings.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ClassBookingsController],
  providers: [ClassBookingsService],
  exports: [ClassBookingsService],
})
export class ClassBookingsModule {}
