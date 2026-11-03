import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberQrModule } from '../../common/services/member-qr.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MemberQrModule, NotificationsModule],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
