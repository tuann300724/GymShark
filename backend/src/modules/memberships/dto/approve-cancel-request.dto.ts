import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Admin duyệt yêu cầu hủy gói: hủy Membership + (tuỳ chọn) hoàn tiền một phần/toàn phần */
export class ApproveCancelRequestDto {
  @ApiPropertyOptional({
    example: 350000,
    description:
      'Số tiền hoàn lại (VND). 0 = hủy gói không hoàn tiền. Mặc định 0 — chỉ ADMIN mới được hoàn tiền > 0',
  })
  @IsOptional()
  @IsNumber({}, { message: 'Số tiền hoàn phải là số' })
  @Min(0, { message: 'Số tiền hoàn không được âm' })
  @Max(999999999, { message: 'Số tiền hoàn quá lớn' })
  refundAmount?: number;

  @ApiPropertyOptional({
    enum: ['BANK_TRANSFER', 'CASH'],
    example: 'BANK_TRANSFER',
    description: 'Phương thức trả lại tiền: chuyển khoản ngân hàng hoặc tiền mặt tại quầy',
  })
  @IsOptional()
  @IsIn(['BANK_TRANSFER', 'CASH'], {
    message: 'Phương thức hoàn tiền chỉ nhận chuyển khoản hoặc tiền mặt',
  })
  refundMethod?: 'BANK_TRANSFER' | 'CASH';

  @ApiPropertyOptional({ example: 'Đồng ý hủy theo yêu cầu hội viên' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
  reason?: string;
}
