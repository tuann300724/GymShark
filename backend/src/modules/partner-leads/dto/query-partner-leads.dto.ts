import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PARTNER_LEAD_DIRECTIONS } from './create-partner-lead.dto';

import { PARTNER_LEAD_STATUSES } from '../partner-lead-workflow';

/** Trạng thái xử lý yêu cầu hợp tác — xem quy trình ở partner-lead-workflow.ts */
export { PARTNER_LEAD_STATUSES };

export class QueryPartnerLeadsDto {
  @ApiPropertyOptional({ example: 'Gym', description: 'Tìm theo tên người liên hệ / email / SĐT' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PARTNER_LEAD_STATUSES })
  @IsOptional()
  @IsIn(PARTNER_LEAD_STATUSES)
  status?: (typeof PARTNER_LEAD_STATUSES)[number];

  @ApiPropertyOptional({ enum: PARTNER_LEAD_DIRECTIONS })
  @IsOptional()
  @IsIn(PARTNER_LEAD_DIRECTIONS)
  direction?: (typeof PARTNER_LEAD_DIRECTIONS)[number];

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
