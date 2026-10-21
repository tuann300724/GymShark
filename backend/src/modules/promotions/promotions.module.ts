import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PromotionsController } from './promotions.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromotionsRepository } from './repository/promotions.repository';
import { TypeOrmPromotionsRepository } from './repository/typeorm-promotions.repository';
import { PROMOTIONS_REPOSITORY } from './repository/promotions.tokens';

@Module({
  imports: [NotificationsModule],
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    { provide: PROMOTIONS_REPOSITORY, useClass: TypeOrmPromotionsRepository },
  ],
  exports: [PromotionsService],
})
export class PromotionsModule {}