import { Module } from '@nestjs/common';
import { TrainerReviewsController } from './trainer-reviews.controller';
import { TrainerReviewsService } from './trainer-reviews.service';

@Module({
  controllers: [TrainerReviewsController],
  providers: [TrainerReviewsService],
  exports: [TrainerReviewsService],
})
export class TrainerReviewsModule {}
