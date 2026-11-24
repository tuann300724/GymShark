import { Module } from '@nestjs/common';
import { PartnersService } from './partners.service';
import {
  AdminPartnersController,
  PartnerSelfController,
} from './partners.controller';

@Module({
  controllers: [PartnerSelfController, AdminPartnersController],
  providers: [PartnersService],
  exports: [PartnersService],
})
export class PartnersModule {}
