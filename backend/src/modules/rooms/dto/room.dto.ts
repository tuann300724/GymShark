import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const ROOM_STATUSES = ['AVAILABLE', 'INACTIVE', 'MAINTENANCE'] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

const ROOM_TYPES = [
  'GYM_AREA',
  'CARDIO',
  'WEIGHT_AREA',
  'GROUP_CLASS',
  'PERSONAL_TRAINING',
  'YOGA',
  'OTHER',
] as const;

export class CreateRoomDto {
  @ApiProperty({ example: 'R-CARDIO-01', description: 'Mã phòng duy nhất trong toàn hệ thống' })
  @IsString({ message: 'Mã phòng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã phòng không được để trống' })
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Phòng Tập Chức Năng', description: 'Tên phòng' })
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ enum: ROOM_TYPES, default: 'GYM_AREA', description: 'Loại phòng' })
  @IsOptional()
  @IsIn(ROOM_TYPES, { message: 'Loại phòng không hợp lệ' })
  type?: string;

  @ApiPropertyOptional({ example: 30, description: 'Sức chứa tối đa' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Sức chứa phải là số nguyên' })
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ example: '3', description: 'Tầng' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  floor?: string;

  @ApiPropertyOptional({ description: 'Mô tả phòng' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ enum: ROOM_STATUSES, default: 'AVAILABLE', description: 'Trạng thái phòng' })
  @IsOptional()
  @IsIn(ROOM_STATUSES, { message: 'Trạng thái phòng không hợp lệ' })
  status?: RoomStatus;
}

export class UpdateRoomDto extends PartialType(CreateRoomDto) {}

export class SetRoomStatusDto {
  @ApiProperty({ enum: ROOM_STATUSES, example: 'AVAILABLE', description: 'Trạng thái mới của phòng' })
  @IsIn(ROOM_STATUSES, { message: 'Trạng thái phòng không hợp lệ' })
  status: RoomStatus;
}
