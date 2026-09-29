import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, PaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tạo mã khuyến mãi (ADMIN/MANAGER) */
export class CreatePromotionDto {
  @ApiProperty({ example: 'WELCOME10', description: 'Mã khuyến mãi (unique, không phân biệt hoa thường)' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã khuyến mãi' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({ example: 'Giảm 10% cho hội viên mới', description: 'Tên chương trình' })
  @IsNotEmpty({ message: 'Vui lòng nhập tên chương trình' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Áp dụng khi đăng ký gói tập lần đầu' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ enum: DiscountType, default: DiscountType.PERCENTAGE })
  @IsNotEmpty({ message: 'Vui lòng chọn loại khuyến mãi' })
  @IsEnum(DiscountType, { message: 'Loại khuyến mãi không hợp lệ' })
  discountType: DiscountType;

  @ApiProperty({
    example: 10,
    description: 'Giá trị giảm: % nếu PERCENTAGE (≤100), số tiền VNĐ nếu FIXED_AMOUNT (>0)',
  })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Giá trị giảm phải là số' })
  @IsPositive({ message: 'Giá trị giảm phải > 0' })
  discountValue: number;

  @ApiPropertyOptional({ description: 'Số tiền giảm tối đa (chỉ áp dụng cho PERCENTAGE)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Giới hạn giảm tối đa phải > 0' })
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'Đơn hàng tối thiểu mới được áp dụng (VNĐ)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Giá trị đơn tối thiểu phải > 0' })
  minOrderAmount?: number;

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z', description: 'Thời gian bắt đầu có hiệu lực' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngày bắt đầu' })
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startAt: string;

  @ApiProperty({ example: '2026-12-31T23:59:59.000Z', description: 'Thời gian kết thúc' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngày kết thúc' })
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endAt: string;

  @ApiPropertyOptional({ description: 'Giới hạn tổng lượt sử dụng (null = không giới hạn)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Giới hạn số lần mỗi hội viên được dùng (null = không giới hạn)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  perMemberLimit?: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE';
}

/** Cập nhật mã khuyến mãi — code không được sửa nếu đã có giao dịch dùng mã */
export class UpdatePromotionDto {
  @ApiPropertyOptional({ description: 'Mã mới — KHÔNG sửa được nếu mã đã được sử dụng' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive({ message: 'Giá trị giảm phải > 0' })
  discountValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxDiscount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  minOrderAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  startAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({})
  endAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  perMemberLimit?: number;
}

/** Lọc danh sách khuyến mãi (admin) */
export class PromotionQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo mã hoặc tên' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'] })
  @IsOptional()
  @IsString()
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  type?: DiscountType;

  @ApiPropertyOptional({ description: 'Lọc theo ngày bắt đầu >= (ISO)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ngày kết thúc <= (ISO)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/** Member tự kiểm tra mã trước khi đăng ký: POST /promotions/validate */
export class ValidatePromotionDto {
  @ApiProperty({ example: 'WELCOME10', description: 'Mã khuyến mãi' })
  @IsNotEmpty({ message: 'Vui lòng nhập mã khuyến mãi' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ID gói tập muốn đăng ký' })
  @IsNotEmpty({ message: 'Vui lòng chọn gói tập' })
  @IsString()
  packageId: string;
}

/** Lọc lịch sử dùng mã (admin) */
export class PromotionUsagesQueryDto {
  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Trạng thái payment: PAID / PENDING / ...' })
  @IsOptional()
  @IsString()
  status?: string;
}