import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RegisterMembershipDto {
  @ApiProperty({ example: 'b7830a19-4070-4435-9c94-f2116fbd7801', description: 'ID của gói tập' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập' })
  @IsString()
  packageId: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH, description: 'Phương thức thanh toán' })
  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Ghi chú thêm (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  notes?: string;
}