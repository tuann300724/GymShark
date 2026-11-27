import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PtSessionsController } from './pt-sessions.controller';
import { PtSessionsService } from './pt-sessions.service';

@Module({
  imports: [ChatModule, NotificationsModule],
  controllers: [PtSessionsController],
  providers: [PtSessionsService],
})
export class PtSessionsModule {}
