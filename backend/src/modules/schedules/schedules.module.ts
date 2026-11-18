import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulesService } from './schedules.service';
import {
  SchedulesController,
  TrainingProgressController,
  TrainingSessionsController,
} from './schedules.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [SchedulesController, TrainingSessionsController, TrainingProgressController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}