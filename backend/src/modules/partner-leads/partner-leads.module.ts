import { Module } from '@nestjs/common';
import { PartnerLeadsController } from './partner-leads.controller';
import { PartnerLeadsService } from './partner-leads.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PartnerLeadsController],
  providers: [PartnerLeadsService],
})
export class PartnerLeadsModule {}
