import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsString } from 'class-validator';

/** Query cho danh sách nhật ký hoạt động (admin) */
export class QueryAuditLogsDto {
  @ApiPropertyOptional({ description: 'Số trang (mặc định 1)' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Số bản ghi mỗi trang (mặc định 20)' })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Lọc theo userId người thực hiện' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo action (VD: AUTH_LOGIN, PAYMENT_CONFIRM...)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Lọc theo entity (VD: Member, Payment...)' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ description: 'Lọc từ ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc đến ngày (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ description: 'Tìm kiếm theo action/entity/entityId' })
  @IsOptional()
  @IsString()
  search?: string;
}