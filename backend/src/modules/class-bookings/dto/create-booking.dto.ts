import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'ID ca nhóm (buổi GROUP_CLASS có sức chứa)' })
  @IsString({ message: 'Ca tập không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn ca tập' })
  scheduleId: string;
}

/** [HLV/QTV] Gán nhiều hội viên vào 1 ca nhóm cùng lúc */
export class AddMembersDto {
  @ApiProperty({
    description: 'Danh sách ID hội viên được gán vào ca nhóm',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray({ message: 'Danh sách hội viên không hợp lệ' })
  @ArrayNotEmpty({ message: 'Vui lòng chọn ít nhất 1 hội viên' })
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  memberIds: string[];
}
