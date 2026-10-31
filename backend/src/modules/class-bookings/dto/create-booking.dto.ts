import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID ca nhóm (buổi GROUP_CLASS có sức chứa)' })
  @IsString({ message: 'Ca tập không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn ca tập' })
  scheduleId: string;
}
