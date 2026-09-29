import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ScheduleStatus, SessionType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID huấn luyện viên' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn huấn luyện viên' })
  trainerId: string;

  @ApiPropertyOptional({ description: 'ID hội viên (bắt buộc nếu loại PERSONAL_TRAINING)' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'ID chi nhánh (mặc định lấy theo HLV)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'ID phòng tập' })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({ enum: SessionType, default: SessionType.PERSONAL_TRAINING })
  @IsOptional()
  @IsEnum(SessionType, { message: 'Loại buổi tập không hợp lệ' })
  type?: SessionType;

  @ApiProperty({ example: 'PT - Tăng cơ toàn thân', description: 'Tiêu đề buổi tập' })
  @IsString()
  @MinLength(2, { message: 'Tiêu đề quá ngắn' })
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả chi tiết buổi tập' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2026-10-01T07:00:00.000Z', description: 'Thời gian bắt đầu (ISO 8601)' })
  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: string;

  @ApiProperty({ example: '2026-10-01T08:00:00.000Z', description: 'Thời gian kết thúc (ISO 8601)' })
  @IsDateString({}, { message: 'Thời gian kết thúc không hợp lệ' })
  endTime: string;

  @ApiPropertyOptional({ description: 'Ghi chú nội bộ' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}

export class CancelSessionDto {
  @ApiPropertyOptional({ example: 'HLV bận việc đột xuất', description: 'Lý do hủy buổi tập' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cancellationNote?: string;
}

export class SessionQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 100, description: 'Calendar cần nhiều bản ghi' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 100;

  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề / tên hội viên / tên HLV' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc từ ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc đến ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Lọc theo HLV' })
  @IsOptional()
  @IsString()
  trainerId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo hội viên' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo chi nhánh' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;
}

export class CreateProgressDto {
  @ApiProperty({ example: 'Member hoàn thành tốt bài tập chân.', description: 'Ghi chú đánh giá buổi tập' })
  @IsString()
  @IsNotEmpty({ message: 'Ghi chú không được để trống' })
  @MaxLength(2000)
  note: string;

  @ApiPropertyOptional({ example: 'Thực hiện 4 hiệp squat 80% sức tối đa, kỹ thuật ổn định.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  performance?: string;

  @ApiPropertyOptional({ example: 'Tăng dần mức tạ 5kg trong 2 buổi tiếp theo.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  recommendation?: string;
}

export class UpdateProgressDto extends PartialType(CreateProgressDto) {}