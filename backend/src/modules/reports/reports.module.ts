import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { EquipmentModule } from '../equipment/equipment.module';
import { BranchesModule } from '../branches/branches.module';
import { ReportsRepository } from './repository/reports.repository';
import { TypeOrmReportsRepository } from './repository/typeorm-reports.repository';
import { REPORTS_REPOSITORY } from './repository/reports.tokens';

@Module({
  imports: [EquipmentModule, BranchesModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    { provide: REPORTS_REPOSITORY, useClass: TypeOrmReportsRepository },
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
