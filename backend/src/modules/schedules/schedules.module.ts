import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { SchedulesRepository } from './repository/schedules.repository';
import { TypeOrmSchedulesRepository } from './repository/typeorm-schedules.repository';
import { SCHEDULES_REPOSITORY } from './repository/schedules.tokens';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, { provide: SCHEDULES_REPOSITORY, useClass: TypeOrmSchedulesRepository }],
  exports: [SchedulesService],
})
export class SchedulesModule {}
