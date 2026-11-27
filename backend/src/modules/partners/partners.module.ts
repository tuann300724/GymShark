import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import {
  AdminPartnersController,
  AdminPartnershipPlansController,
  PartnerSelfController,
} from './partners.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PartnerSelfController, AdminPartnersController, AdminPartnershipPlansController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
