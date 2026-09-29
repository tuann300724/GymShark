import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTickerService } from './notification-ticker.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationTickerService],
  exports: [NotificationsService],
})
export class NotificationsModule {}