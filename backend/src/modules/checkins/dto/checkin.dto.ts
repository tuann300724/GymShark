import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CheckInMethod, CheckInStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({
    enum: CheckInMethod,
    default: CheckInMethod.MANUAL,
    description: 'Phương thức check-in (mặc định MANUAL khi tự check-in)',
  })
  @IsOptional()
  @IsEnum(CheckInMethod)
  method?: CheckInMethod;

  @ApiPropertyOptional({
    description: 'Chi nhánh check-in (mặc định chi nhánh của hội viên; gói giới hạn branch sẽ được kiểm tra)',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class StaffCheckInDto {
  @ApiProperty({ description: 'ID hội viên cần check-in (không tin memberId do member gửi)' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiPropertyOptional({
    enum: CheckInMethod,
    default: CheckInMethod.STAFF,
    description: 'Phương thức check-in (mặc định STAFF khi lễ tân thao tác)',
  })
  @IsOptional()
  @IsEnum(CheckInMethod)
  method?: CheckInMethod;

  @ApiPropertyOptional({ description: 'Ghi chú ngắn (ví dụ quét thẻ / nhập tay)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;

  @ApiPropertyOptional({
    description: 'Chi nhánh check-in (mặc định chi nhánh của hội viên; STAFF buộc phải ở chi nhánh mình)',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class GetCheckinsQueryDto {
  @ApiPropertyOptional({ default: 1, description: 'Trang hiện tại' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, description: 'Số bản ghi mỗi trang' })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tìm hội viên theo tên / mã thẻ / SĐT' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: CheckInStatus, description: 'Lọc theo trạng thái phiên tập' })
  @IsOptional()
  @IsEnum(CheckInStatus)
  status?: CheckInStatus;

  @ApiPropertyOptional({ description: 'Lọc theo chi nhánh (branchId)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  toDate?: string;

  @ApiPropertyOptional({ enum: ['checkInTime', 'checkOutTime', 'createdAt'], default: 'checkInTime' })
  @IsOptional()
  @IsIn(['checkInTime', 'checkOutTime', 'createdAt'])
  sortBy?: 'checkInTime' | 'checkOutTime' | 'createdAt' = 'checkInTime';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class MyHistoryQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Lọc theo tháng (YYYY-MM). Ưu tiên hơn fromDate/toDate nếu có',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month phải có dạng YYYY-MM' })
  month?: string;

  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  toDate?: string;
}

export class DailyReportQueryDto {
  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD), mặc định 30 ngày trước' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD), mặc định hôm nay' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class HourlyReportQueryDto {
  @ApiPropertyOptional({ description: 'Ngày cần xem (YYYY-MM-DD), mặc định hôm nay' })
  @IsOptional()
  @IsISO8601()
  date?: string;
}

export class MemberAttendanceQueryDto {
  @ApiPropertyOptional({ description: 'Từ ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Đến ngày (YYYY-MM-DD)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Tìm theo tên / mã / SĐT hội viên' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class FaceCheckInDto {
  @ApiProperty({
    description:
      'Vector khuôn mặt đọc từ webcam tại thời điểm quét (client tính bằng model AI trong trình duyệt, không gửi ảnh)',
  })
  @IsArray()
  embedding: number[];

  @ApiPropertyOptional({
    description: 'Chi nhánh check-in (mặc định chi nhánh của hội viên; gói giới hạn branch sẽ được kiểm tra)',
  })
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class FaceScanDto {
  @ApiProperty({
    description: 'Vector khuôn mặt của người đứng trước camera lễ tân (nhận diện 1:N phía server)',
  })
  @IsArray()
  embedding: number[];
}