import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const PT_SESSION_STATUSES = [
  'OFFERED',
  'AWAITING_PAYMENT',
  'PAID',
  'DECLINED',
  'CANCELLED',
] as const;
export const PT_PAYOUT_STATUSES = ['UNPAID', 'PAID_OUT'] as const;
/** Hội viên thanh toán buổi PT: chuyển khoản (QR/CASSO) hoặc tiền mặt tại quầy */
export const PT_SESSION_PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH'] as const;

/** PT đề nghị một buổi tập cho hội viên đã nhắn tin với mình */
export class CreatePtSessionDto {
  @ApiProperty({ description: 'ID hội viên (đã có hội thoại với PT)' })
  @IsString()
  memberId: string;

  @ApiProperty({ example: 'Buổi tập ngực – vai 1:1' })
  @IsString()
  @MinLength(2, { message: 'Tên buổi tập quá ngắn' })
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '2026-12-01T18:00:00.000Z' })
  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  startTime: string;

  @ApiProperty({ example: 60, description: 'Thời lượng (phút)' })
  @Type(() => Number)
  @IsInt()
  @Min(30, { message: 'Buổi tập tối thiểu 30 phút' })
  @Max(240, { message: 'Buổi tập tối đa 240 phút' })
  durationMinutes: number;

  @ApiProperty({ example: 350000, description: 'Giá buổi tập (VND)' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(10000, { message: 'Giá tối thiểu 10.000đ' })
  @Max(100000000)
  price: number;

  @ApiPropertyOptional({ description: 'Ghi chú: địa điểm, nội dung buổi tập...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class AcceptPtSessionDto {
  @ApiPropertyOptional({ enum: PT_SESSION_PAYMENT_METHODS, default: 'BANK_TRANSFER' })
  @IsOptional()
  @IsIn(PT_SESSION_PAYMENT_METHODS, { message: 'Phương thức thanh toán không hợp lệ' })
  paymentMethod?: (typeof PT_SESSION_PAYMENT_METHODS)[number];
}

export class DeclinePtSessionDto {
  @ApiPropertyOptional({ description: 'Lý do từ chối (tuỳ chọn)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class PtSessionQueryDto {
  @ApiPropertyOptional({ enum: PT_SESSION_STATUSES })
  @IsOptional()
  @IsIn(PT_SESSION_STATUSES)
  status?: (typeof PT_SESSION_STATUSES)[number];

  @ApiPropertyOptional({ enum: PT_PAYOUT_STATUSES })
  @IsOptional()
  @IsIn(PT_PAYOUT_STATUSES)
  payoutStatus?: (typeof PT_PAYOUT_STATUSES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  trainerId?: string;
}

export class PtPayoutDto {
  @ApiProperty({ description: 'Chi trả cho PT này (mọi buổi đã thanh toán, đã diễn ra, chưa chi)' })
  @IsString()
  trainerId: string;
}
