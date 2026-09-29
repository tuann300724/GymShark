import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const BRANCH_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type BranchStatus = (typeof BRANCH_STATUSES)[number];

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

export class CreateBranchDto {
  @ApiProperty({ example: 'BR-HCM02', description: 'Mã chi nhánh duy nhất (viết hoa, không dấu)' })
  @IsString({ message: 'Mã chi nhánh phải là chuỗi ký tự' })
  @Matches(/^[A-Za-z0-9_-]{3,20}$/, { message: 'Mã chi nhánh 3-20 ký tự (chữ, số, -, _)' })
  code: string;

  @ApiProperty({ example: 'GymMaster - Gò Vấp', description: 'Tên chi nhánh' })
  @IsString({ message: 'Tên chi nhánh phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: '12 Quang Trung, Phường 10, Gò Vấp, TP. HCM', description: 'Địa chỉ' })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @MaxLength(500)
  address: string;

  @ApiProperty({ example: '028.3895.1234', description: 'Số điện thoại liên hệ' })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9+\-\s]{8,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiPropertyOptional({ example: 'govap@gymmaster.vn', description: 'Email liên hệ' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ description: 'Mô tả ngắn về chi nhánh' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: '05:30', description: 'Giờ mở cửa (HH:mm)' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ mở cửa phải dạng HH:mm' })
  openingTime?: string;

  @ApiPropertyOptional({ example: '22:00', description: 'Giờ đóng cửa (HH:mm)' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Giờ đóng cửa phải dạng HH:mm' })
  closingTime?: string;

  @ApiPropertyOptional({ example: '05:30 - 22:00 (Tất cả các ngày)', description: 'Chuỗi mô tả giờ mở cửa' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string;

  @ApiPropertyOptional({ enum: BRANCH_STATUSES, default: 'ACTIVE', description: 'Trạng thái chi nhánh' })
  @IsOptional()
  @IsIn(BRANCH_STATUSES, { message: 'Trạng thái chi nhánh không hợp lệ' })
  status?: BranchStatus;
}

export class UpdateBranchDto extends PartialType(CreateBranchDto) {}

export class SetBranchStatusDto {
  @ApiProperty({ enum: BRANCH_STATUSES, example: 'INACTIVE', description: 'Trạng thái mới (ACTIVE/INACTIVE)' })
  @IsIn(BRANCH_STATUSES, { message: 'Trạng thái chi nhánh không hợp lệ' })
  status: BranchStatus;
}

export class CreateRoomDto {
  @ApiProperty({ example: 'BR-HCM02-R01', description: 'Mã phòng duy nhất trong chi nhánh' })
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