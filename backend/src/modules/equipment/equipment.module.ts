import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController, EquipmentMaintenanceController } from './equipment.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EquipmentRepository } from './repository/equipment.repository';
import { TypeOrmEquipmentRepository } from './repository/typeorm-equipment.repository';
import { EQUIPMENT_REPOSITORY } from './repository/equipment.tokens';

@Module({
  imports: [NotificationsModule],
  controllers: [EquipmentController, EquipmentMaintenanceController],
  providers: [
    EquipmentService,
    { provide: EQUIPMENT_REPOSITORY, useClass: TypeOrmEquipmentRepository },
  ],
  exports: [EquipmentService],
})
export class EquipmentModule {}
