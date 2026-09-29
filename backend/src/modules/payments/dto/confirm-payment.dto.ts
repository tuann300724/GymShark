import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Xác nhận thanh toán: PENDING → PAID (kèm mã giao dịch ngoài nếu có) */
export class ConfirmPaymentDto {
  @ApiPropertyOptional({
    example: 'VCB-29102026-001',
    description: 'Mã giao dịch ngoài (sao kê ngân hàng / cổng thanh toán) — unique nếu có',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({ example: 'Đã đối soát sao kê ngân hàng', description: 'Ghi chú xác nhận' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}