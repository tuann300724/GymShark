import { ApiProperty } from '@nestjs/swagger';
import { EquipmentStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class SetEquipmentStatusDto {
  @ApiProperty({
    enum: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE, EquipmentStatus.MAINTENANCE, EquipmentStatus.BROKEN, EquipmentStatus.RETIRED],
    example: EquipmentStatus.AVAILABLE,
    description: 'Trạng thái mới của thiết bị',
  })
  @IsEnum(EquipmentStatus, { message: 'Trạng thái thiết bị không hợp lệ' })
  status: EquipmentStatus;
}