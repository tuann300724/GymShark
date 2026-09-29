import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { MemberModule } from '../member/member.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [MemberModule, PaymentsModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
