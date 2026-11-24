import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AttributePaymentDto {
  @ApiProperty({ example: 'PAY-2026-000123', description: 'Mã giao dịch cần gán doanh thu cho đối tác' })
  @IsNotEmpty({ message: 'Mã giao dịch không được để trống' })
  @IsString()
  @MaxLength(400)
  paymentCode: string;
}
