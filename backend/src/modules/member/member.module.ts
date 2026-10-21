import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberQrModule } from '../../common/services/member-qr.module';
import { MemberRepository } from './repository/member.repository';
import { TypeOrmMemberRepository } from './repository/typeorm-member.repository';
import { MEMBER_REPOSITORY } from './repository/member.tokens';

@Module({
  imports: [MemberQrModule],
  controllers: [MemberController],
  providers: [
    MemberService,
    { provide: MEMBER_REPOSITORY, useClass: TypeOrmMemberRepository },
  ],
  exports: [MemberService],
})
export class MemberModule {}
