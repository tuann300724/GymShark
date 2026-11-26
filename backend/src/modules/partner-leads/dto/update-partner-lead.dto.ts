import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PARTNER_LEAD_STATUSES } from './query-partner-leads.dto';

/** Admin cập nhật trạng thái / ghi chú nội bộ của một yêu cầu hợp tác */
export class UpdatePartnerLeadDto {
  @ApiPropertyOptional({ enum: PARTNER_LEAD_STATUSES })
  @IsOptional()
  @IsIn(PARTNER_LEAD_STATUSES)
  status?: (typeof PARTNER_LEAD_STATUSES)[number];

  @ApiPropertyOptional({ description: 'Ghi chú nội bộ của admin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
