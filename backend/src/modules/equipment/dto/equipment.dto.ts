import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EquipmentCondition, EquipmentStatus, MaintenanceStatus, MaintenanceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const EQUIPMENT_CATEGORIES = ['CARDIO', 'FREE_WEIGHT', 'MACHINE', 'ACCESSORY', 'OTHER'] as const;
export const EQUIPMENT_CREATE_STATUSES: EquipmentStatus[] = [
  EquipmentStatus.AVAILABLE,
  EquipmentStatus.IN_USE,
  EquipmentStatus.MAINTENANCE,
  EquipmentStatus.BROKEN,
  EquipmentStatus.RETIRED,
];

export class CreateEquipmentDto {
  @ApiProperty({ example: 'EQ-TD-ROW-01', description: 'Mã thiết bị duy nhất toàn hệ thống' })
  @IsString({ message: 'Mã thiết bị phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã thiết bị không được để trống' })
  @Matches(/^[A-Za-z0-9_-]{3,50}$/, { message: 'Mã thiết bị 3-50 ký tự (chữ, số, -, _)' })
  code: string;

  @ApiProperty({ example: 'Máy Rowing Concept2', description: 'Tên thiết bị' })
  @IsString()
  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  @MaxLength(200)
  name: string;

  @ApiProperty({ enum: EQUIPMENT_CATEGORIES, example: 'CARDIO', description: 'Nhóm thiết bị' })
  @IsIn(EQUIPMENT_CATEGORIES, { message: 'Nhóm thiết bị không hợp lệ' })
  category: string;

  @ApiProperty({ description: 'Chi nhánh sở hữu thiết bị (phải tồn tại)' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn chi nhánh' })
  branchId: string;

  @ApiPropertyOptional({ description: 'Phòng đặt thiết bị (phải thuộc chi nhánh)' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ example: 'Concept2 Model D', description: 'Hãng sản xuất' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'Model D PM5', description: 'Model' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ example: 'CT2-MD-2025-100', description: 'Số serial (unique nếu có)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiPropertyOptional({ example: '2025-06-01', description: 'Ngày mua (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày mua không đúng định dạng' })
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 32000000, description: 'Giá trị khi mua (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá trị phải là số' })
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: '2028-06-01', description: 'Hạn bảo hành (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Hạn bảo hành không đúng định dạng' })
  warrantyExpiry?: string;

  @ApiPropertyOptional({ enum: EquipmentStatus, default: EquipmentStatus.AVAILABLE })
  @IsOptional()
  @IsIn(EQUIPMENT_CREATE_STATUSES, { message: 'Trạng thái thiết bị không hợp lệ' })
  status?: EquipmentStatus;

  @ApiPropertyOptional({ enum: EquipmentCondition, default: EquipmentCondition.GOOD })
  @IsOptional()
  @IsEnum(EquipmentCondition, { message: 'Tình trạng thiết bị không hợp lệ' })
  condition?: EquipmentCondition;

  @ApiPropertyOptional({ example: '2026-11-01', description: 'Ngày bảo trì định kỳ tiếp theo (ISO)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bảo trì tiếp theo không đúng định dạng' })
  nextMaintenanceAt?: string;

  @ApiPropertyOptional({ description: 'Mô tả / ghi chú' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {}

export class EquipmentQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tìm theo mã / tên / hãng / model / serial' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo nhóm thiết bị (CARDIO, FREE_WEIGHT ...)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: EquipmentStatus, description: 'Lọc theo trạng thái' })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiPropertyOptional({ enum: EquipmentCondition, description: 'Lọc theo tình trạng' })
  @IsOptional()
  @IsEnum(EquipmentCondition)
  condition?: EquipmentCondition;

  @ApiPropertyOptional({ description: 'Lọc theo chi nhánh' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo phòng' })
  @IsOptional()
  @IsString()
  roomId?: string;
}

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'ID thiết bị cần bảo trì' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn thiết bị' })
  equipmentId: string;

  @ApiPropertyOptional({ enum: MaintenanceType, default: MaintenanceType.ROUTINE })
  @IsOptional()
  @IsEnum(MaintenanceType, { message: 'Loại bảo trì không hợp lệ' })
  type?: MaintenanceType;

  @ApiPropertyOptional({ example: '2026-10-05', description: 'Ngày bảo trì (mặc định bây giờ)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bảo trì không đúng định dạng' })
  maintenanceDate?: string;

  @ApiPropertyOptional({ example: 1200000, description: 'Chi phí bảo trì (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Chi phí phải là số' })
  @Min(0)
  cost?: number;

  @ApiProperty({ example: 'Vệ sinh, tra dầu và kiểm tra hệ thống phanh.', description: 'Mô tả công việc' })
  @IsString()
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @MaxLength(2000)
  description: string;

  @ApiPropertyOptional({ example: 'Đội kỹ thuật GymMaster', description: 'Người thực hiện' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  performedBy?: string;

  @ApiPropertyOptional({ example: '2027-10-05', description: 'Ngày bảo trì định kỳ tiếp theo' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bảo trì tiếp theo không đúng định dạng' })
  nextDueDate?: string;

  @ApiPropertyOptional({ enum: MaintenanceStatus, default: MaintenanceStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}

export class CompleteMaintenanceDto {
  @ApiPropertyOptional({ example: 1500000, description: 'Chi phí thực tế (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Chi phí phải là số' })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: '2026-11-05', description: 'Ngày bảo trì tiếp theo (lịch định kỳ mới)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày bảo trì tiếp theo không đúng định dạng' })
  nextDueDate?: string;

  @ApiPropertyOptional({ example: 'Đội kỹ thuật GymMaster', description: 'Người thực hiện hoàn tất' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  performedBy?: string;

  @ApiPropertyOptional({ description: 'Kết quả / ghi chú hoàn tất' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: EquipmentCondition, description: 'Tình trạng thiết bị sau bảo trì' })
  @IsOptional()
  @IsEnum(EquipmentCondition)
  condition?: EquipmentCondition;

  @ApiPropertyOptional({ description: 'Đánh dấu thiết bị hỏng (status → BROKEN) thay vì trả về AVAILABLE' })
  @IsOptional()
  @IsBoolean()
  markBroken?: boolean;
}

export class MaintenanceQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Lọc theo thiết bị' })
  @IsOptional()
  @IsString()
  equipmentId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo chi nhánh (qua thiết bị)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({ enum: MaintenanceType })
  @IsOptional()
  @IsEnum(MaintenanceType)
  type?: MaintenanceType;
}