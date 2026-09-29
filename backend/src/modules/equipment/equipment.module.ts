import { Module } from '@nestjs/common';
import { EquipmentService } from './equipment.service';
import { EquipmentController, EquipmentMaintenanceController } from './equipment.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EquipmentController, EquipmentMaintenanceController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}