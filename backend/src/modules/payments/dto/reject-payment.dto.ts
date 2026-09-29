import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Từ chối / hủy thanh toán đang chờ: PENDING → CANCELLED */
export class RejectPaymentDto {
  @ApiPropertyOptional({ example: 'Sai thông tin thanh toán, member nhờ hủy', description: 'Lý do từ chối/hủy' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}