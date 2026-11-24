import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class PartnerDecisionDto {
  @ApiPropertyOptional({ example: 'Hồ sơ hợp lệ', description: 'Ghi chú khi duyệt / từ chối / tạm khóa' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
