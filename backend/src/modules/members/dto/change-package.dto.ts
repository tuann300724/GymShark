import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../../common/constants/db-enums';

export class ChangePackageDto {
  @ApiProperty({ description: 'ID gói tập mới' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập mới' })
  @IsString()
  newPackageId: string;

  @ApiPropertyOptional({
    enum: [PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER],
    default: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum([PaymentMethod.CASH, PaymentMethod.BANK_TRANSFER], {
    message: 'Phương thức thanh toán chỉ được là Tiền mặt hoặc Chuyển khoản',
  })
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
}
