import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Member tạo yêu cầu thanh toán (POST /payments/me).
 * Frontend KHÔNG quyết định amount — backend lấy giá từ package và tính lại.
 */
export class MemberPaymentCreateDto {
  @ApiProperty({ description: 'ID gói tập cần đăng ký / gia hạn' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập' })
  @IsString()
  packageId: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Mã khuyến mãi (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  promotionCode?: string;

  @ApiPropertyOptional({ description: 'true = gia hạn gói đang chạy, false/mặc định = đăng ký mới' })
  @IsOptional()
  @IsBoolean()
  renew?: boolean;
}