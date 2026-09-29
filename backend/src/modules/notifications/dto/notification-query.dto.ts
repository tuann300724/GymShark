import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

/** Query chung cho danh sách thông báo */
export class NotificationListQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'unread', 'read'], description: 'Tab lọc trạng thái đọc' })
  @IsOptional()
  @IsIn(['all', 'unread', 'read'])
  tab?: 'all' | 'unread' | 'read';

  @ApiPropertyOptional({
    enum: ['PAYMENT', 'MEMBERSHIP', 'CHECKIN', 'TRAINING', 'PROMOTION', 'EQUIPMENT', 'SYSTEM'],
    description: 'Lọc theo loại thông báo',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Lọc từ ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc đến ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Chỉ chưa đọc (admin: true/false)' })
  @IsOptional()
  @IsIn(['true', 'false'])
  unread?: string;

  @ApiPropertyOptional({
    enum: ['ADMIN', 'MANAGER', 'STAFF', 'TRAINER', 'MEMBER'],
    description: 'Lọc theo role người nhận (admin)',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề/nội dung (admin)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Số bản ghi tối đa' })
  @IsOptional()
  limit?: number;
}