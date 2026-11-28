import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** ~500KB ảnh chụp màn hình chuyển khoản sau nén */
export const PAYOUT_PROOF_MAX_LENGTH = 700_000;

/** 2 loại hợp tác đối tác — khớp hướng hợp tác của yêu cầu (PartnerLead.direction) */
export const PARTNERSHIP_TYPES = ['OWNER', 'COMMUNITY'] as const;
export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

/** Admin xác nhận đã chuyển hoa hồng cho đối tác (kèm ảnh chứng từ) */
export class CreatePartnerPayoutDto {
  @ApiPropertyOptional({ description: 'Chi các lượt từ ngày (ISO) — trống = từ đầu' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Chi các lượt đến ngày (ISO) — trống = đến hiện tại' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiProperty({ description: 'Ảnh chụp giao dịch chuyển khoản (data URL JPG/PNG/WEBP)' })
  @IsString()
  @MaxLength(PAYOUT_PROOF_MAX_LENGTH, { message: 'Ảnh chứng từ quá lớn' })
  proofImage!: string;

  @ApiPropertyOptional({ description: 'Ghi chú (mã giao dịch, ngân hàng chuyển...)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Admin sửa giá gói hợp tác (áp dụng cho hợp đồng ký mới, không đổi hợp đồng cũ) */
export class UpdatePartnershipPlanDto {
  @ApiProperty({ example: 799000, description: 'Phí hợp tác mỗi tháng (VND)' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 0 }, { message: 'Giá phải là số nguyên (VND)' })
  @Min(0, { message: 'Giá không được âm' })
  @Max(1_000_000_000, { message: 'Giá quá lớn' })
  monthlyPrice!: number;

  @ApiPropertyOptional({ example: 'Lên Gym Cộng đồng' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  name?: string;
}

/** Admin đổi loại hợp tác / gia hạn hợp đồng của đối tác */
export class UpdatePartnerContractDto {
  @ApiPropertyOptional({ enum: PARTNERSHIP_TYPES })
  @IsOptional()
  @IsIn(PARTNERSHIP_TYPES, { message: 'Loại hợp tác không hợp lệ' })
  partnershipType?: PartnershipType;

  @ApiPropertyOptional({
    example: 12,
    description: 'Gia hạn thêm N tháng (tính từ ngày hết hạn, hoặc từ hôm nay nếu đã hết hạn)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số tháng gia hạn phải là số nguyên' })
  @Min(1)
  @Max(60)
  extendMonths?: number;
}

/** Đối tác xin gia hạn hợp đồng — admin xác nhận thu phí rồi gia hạn thủ công */
export class RenewalRequestDto {
  @ApiProperty({ example: 1, description: 'Số tháng muốn gia hạn (1–12)' })
  @Type(() => Number)
  @IsInt({ message: 'Số tháng phải là số nguyên' })
  @Min(1)
  @Max(12, { message: 'Gia hạn tối đa 12 tháng mỗi lần; hợp đồng dài hơn vui lòng liên hệ trực tiếp' })
  months!: number;

  @ApiPropertyOptional({ example: 'Muốn gia hạn trước khi hết hạn 3 ngày' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
