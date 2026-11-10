import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

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

  @ApiPropertyOptional({
    example: 350000,
    description:
      'Số tiền hoàn thực tế (VND) — cho phép hoàn một phần. Mặc định = toàn bộ số tiền giao dịch. Phải > 0 và không vượt quá số tiền đã thanh toán',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Số tiền hoàn phải là số' })
  @Min(1, { message: 'Số tiền hoàn phải lớn hơn 0' })
  @Max(999999999, { message: 'Số tiền hoàn quá lớn' })
  refundAmount?: number;

  @ApiPropertyOptional({
    enum: ['BANK_TRANSFER', 'CASH'],
    example: 'BANK_TRANSFER',
    description: 'Cách trả lại tiền cho hội viên: chuyển khoản ngân hàng hoặc tiền mặt tại quầy',
  })
  @IsOptional()
  @IsIn(['BANK_TRANSFER', 'CASH'], {
    message: 'Phương thức hoàn tiền chỉ nhận chuyển khoản hoặc tiền mặt',
  })
  refundMethod?: 'BANK_TRANSFER' | 'CASH';
}
