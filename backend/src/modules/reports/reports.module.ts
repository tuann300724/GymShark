import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EquipmentModule } from '../equipment/equipment.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [EquipmentModule, BranchesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
