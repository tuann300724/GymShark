import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/**
 * Lễ tân tạo thẻ tập cho hội viên tại quầy (POST /members/:id/memberships).
 * - payNow = false → tạo thẻ PENDING + hoá đơn chờ, lễ tân xác nhận tiền sau ở /admin/payments.
 * - payNow = true  → thu tiền tại quầy, xác nhận + kích hoạt ngay (ACTIVE / PAID).
 */
export class RegisterCardDto {
  @ApiProperty({ example: 'b7830a19-4070-4435-9c94-f2116fbd7801', description: 'ID của gói tập' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập' })
  @IsString()
  packageId: string;

  @ApiPropertyOptional({
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
    description: 'Phương thức thanh toán tại quầy',
  })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Mã khuyến mãi (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  promotionCode?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'true = thu tiền ngay tại quầy và kích hoạt thẻ',
  })
  @IsOptional()
  @IsBoolean()
  payNow?: boolean;

  @ApiPropertyOptional({ description: 'Mã giao dịch khi chuyển khoản (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionRef?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thêm (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
