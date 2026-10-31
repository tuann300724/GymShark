import { Module } from '@nestjs/common';
import { ClassBookingsService } from './class-bookings.service';
import { ClassBookingsController } from './class-bookings.controller';

@Module({
  controllers: [ClassBookingsController],
  providers: [ClassBookingsService],
  exports: [ClassBookingsService],
})
export class ClassBookingsModule {}
