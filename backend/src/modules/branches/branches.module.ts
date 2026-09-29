import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController, RoomsController } from './branches.controller';

@Module({
  controllers: [BranchesController, RoomsController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
