import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Hoàn tiền: PAID → REFUNDED (chỉ ADMIN) */
export class RefundPaymentDto {
  @ApiPropertyOptional({ example: 'Hoàn tiền theo yêu cầu của hội viên', description: 'Lý do hoàn tiền' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Đồng thời hủy Membership nếu còn ACTIVE (mặc định false)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  deactivateMembership?: boolean;
}