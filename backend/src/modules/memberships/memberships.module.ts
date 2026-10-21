import { Module } from "@nestjs/common";
import { MembershipsService } from "./memberships.service";
import { MembershipsController } from "./memberships.controller";
import { MembershipsRepository } from "./repository/memberships.repository";
import { TypeOrmMembershipsRepository } from "./repository/typeorm-memberships.repository";
import { MEMBERSHIPS_REPOSITORY } from "./repository/memberships.tokens";

@Module({
  controllers: [MembershipsController],
  providers: [
    MembershipsService,
    { provide: MEMBERSHIPS_REPOSITORY, useClass: TypeOrmMembershipsRepository },
  ],
  exports: [MembershipsService],
})
export class MembershipsModule {}
