import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import {
  SchedulesController,
  TrainingProgressController,
  TrainingSessionsController,
} from './schedules.controller';

@Module({
  controllers: [SchedulesController, TrainingSessionsController, TrainingProgressController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}