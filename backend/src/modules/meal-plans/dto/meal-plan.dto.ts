import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { MealPlanScope, MealPlanStatus, MealType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class MealItemInputDto {
  @ApiPropertyOptional({ description: 'ID thực phẩm trong thư viện (nếu chọn từ thư viện)' })
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiPropertyOptional({ description: 'Tên hiển thị (bắt buộc nếu không chọn từ thư viện)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  imageUrl?: string;

  @ApiProperty({ example: 150, description: 'Khối lượng (gram)' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 'g' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @ApiPropertyOptional({ description: 'Dinh dưỡng tự nhập khi không lấy từ thư viện' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  protein?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fat?: number;
}

export class MealInputDto {
  @ApiProperty({ enum: MealType })
  @IsEnum(MealType, { message: 'Bữa ăn không hợp lệ' })
  type!: MealType;

  @ApiPropertyOptional({ description: '0 = Thứ 2 … 6 = Chủ nhật (thực đơn tuần)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  dayIndex?: number;

  @ApiPropertyOptional({ example: '07:30' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ description: 'Ảnh minh hoạ bữa ăn (data URL base64)' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  imageData?: string;

  @ApiProperty({ type: [MealItemInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Mỗi bữa ăn cần ít nhất một thực phẩm' })
  @ValidateNested({ each: true })
  @Type(() => MealItemInputDto)
  items!: MealItemInputDto[];
}

export class CreateMealPlanDto {
  @ApiProperty({ example: 'Thực đơn tăng cơ tuần 1' })
  @IsString()
  @MinLength(1, { message: 'Tên thực đơn không được để trống' })
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({ description: 'Ghi chú/hướng dẫn của HLV' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: MealPlanScope })
  @IsOptional()
  @IsEnum(MealPlanScope)
  scope?: MealPlanScope;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (ISO)' })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({ description: 'ID hội viên nhận thực đơn (bỏ trống nếu là thực đơn mẫu)' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Lưu thành thực đơn mẫu để tái sử dụng' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  templateName?: string;

  @ApiPropertyOptional({ description: 'Ảnh tham khảo của cả thực đơn' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  imageData?: string;

  @ApiPropertyOptional({ enum: MealPlanStatus })
  @IsOptional()
  @IsEnum(MealPlanStatus)
  status?: MealPlanStatus;

  @ApiProperty({ type: [MealInputDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Thực đơn cần ít nhất một bữa ăn' })
  @ValidateNested({ each: true })
  @Type(() => MealInputDto)
  meals!: MealInputDto[];
}

export class UpdateMealPlanDto extends PartialType(CreateMealPlanDto) {}

export class DuplicateMealPlanDto {
  @ApiPropertyOptional({ description: 'Hội viên nhận bản sao' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;
}

export class MealPlanQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tiêu đề thực đơn' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo hội viên' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ enum: MealPlanStatus })
  @IsOptional()
  @IsEnum(MealPlanStatus)
  status?: MealPlanStatus;

  @ApiPropertyOptional({ description: 'Chỉ lấy thực đơn mẫu (true/false)' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class SendMealPlanDto {
  @ApiPropertyOptional({ description: 'Ghi chú kèm khi gửi' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;
}
