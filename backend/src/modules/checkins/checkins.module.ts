import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { FacesModule } from '../faces/faces.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [FacesModule, NotificationsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
