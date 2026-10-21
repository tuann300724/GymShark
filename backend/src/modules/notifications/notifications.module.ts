import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationTickerService } from './notification-ticker.service';
import { NotificationsRepository } from './repository/notifications.repository';
import { TypeOrmNotificationsRepository } from './repository/typeorm-notifications.repository';
import { NOTIFICATIONS_REPOSITORY } from './repository/notifications.tokens';

@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationTickerService,
    { provide: NOTIFICATIONS_REPOSITORY, useClass: TypeOrmNotificationsRepository },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}