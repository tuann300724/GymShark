import { Module } from "@nestjs/common";
import { BranchesService } from "./branches.service";
import { BranchesController, RoomsController } from "./branches.controller";
import { BranchesRepository } from "./repository/branches.repository";
import { TypeOrmBranchesRepository } from "./repository/typeorm-branches.repository";
import { BRANCHES_REPOSITORY } from "./repository/branches.tokens";

@Module({
  controllers: [BranchesController, RoomsController],
  providers: [
    BranchesService,
    { provide: BRANCHES_REPOSITORY, useClass: TypeOrmBranchesRepository },
  ],
  exports: [BranchesService],
})
export class BranchesModule {}
