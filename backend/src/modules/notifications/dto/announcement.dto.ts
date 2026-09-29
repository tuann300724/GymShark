import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const ANNOUNCEMENT_TARGETS = [
  'ALL',
  'MEMBERS',
  'TRAINERS',
  'STAFF',
  'MANAGERS',
  'SPECIFIC_BRANCH',
] as const;

/** Tạo thông báo hàng loạt (ADMIN/MANAGER) */
export class AnnouncementDto {
  @ApiProperty({ example: 'Bảo trì hệ thống', description: 'Tiêu đề thông báo' })
  @IsNotEmpty({ message: 'Vui lòng nhập tiêu đề' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Hệ thống bảo trì từ 23:00 hôm nay.', description: 'Nội dung' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({
    enum: ANNOUNCEMENT_TARGETS,
    example: 'MEMBERS',
    description: 'Đối tượng nhận thông báo',
  })
  @IsNotEmpty({ message: 'Vui lòng chọn đối tượng nhận' })
  @IsIn(ANNOUNCEMENT_TARGETS, { message: 'Đối tượng nhận không hợp lệ' })
  target: (typeof ANNOUNCEMENT_TARGETS)[number];

  @ApiPropertyOptional({ description: 'Chi nhánh (bắt buộc khi target = SPECIFIC_BRANCH)' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Hiển thị từ lúc (ISO) — hiện gửi ngay' })
  @IsOptional()
  @IsDateString({})
  startAt?: string;

  @ApiPropertyOptional({ description: 'Hiển thị đến lúc (ISO)' })
  @IsOptional()
  @IsDateString({})
  endAt?: string;
}