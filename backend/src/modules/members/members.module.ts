import { Module } from "@nestjs/common";
import { MembersService } from "./members.service";
import { MembersController } from "./members.controller";
import { MemberModule } from "../member/member.module";
import { PaymentsModule } from "../payments/payments.module";
import { MembersRepository } from "./repository/members.repository";
import { TypeOrmMembersRepository } from "./repository/typeorm-members.repository";
import { MEMBERS_REPOSITORY } from "./repository/members.tokens";

@Module({
  imports: [MemberModule, PaymentsModule],
  controllers: [MembersController],
  providers: [
    MembersService,
    { provide: MEMBERS_REPOSITORY, useClass: TypeOrmMembersRepository },
  ],
  exports: [MembersService],
})
export class MembersModule {}
