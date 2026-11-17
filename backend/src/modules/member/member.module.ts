import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
