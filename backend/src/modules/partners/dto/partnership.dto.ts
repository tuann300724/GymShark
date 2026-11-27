import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** 2 loại hợp tác đối tác — khớp hướng hợp tác của yêu cầu (PartnerLead.direction) */
export const PARTNERSHIP_TYPES = ['OWNER', 'COMMUNITY'] as const;
export type PartnershipType = (typeof PARTNERSHIP_TYPES)[number];

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
