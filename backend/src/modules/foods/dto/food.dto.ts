import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { FoodCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateFoodDto {
  @ApiProperty({ example: 'Ức gà' })
  @IsString()
  @MinLength(1, { message: 'Tên thực phẩm không được để trống' })
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ enum: FoodCategory, description: 'Nhóm thực phẩm' })
  @IsOptional()
  @IsEnum(FoodCategory, { message: 'Nhóm thực phẩm không hợp lệ' })
  category?: FoodCategory;

  @ApiPropertyOptional({ description: 'Ảnh minh họa (URL hoặc data URL base64)' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000, { message: 'Ảnh minh họa quá lớn' })
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 100, description: 'Khẩu phần hiển thị (gram/ml)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  servingSize?: number;

  @ApiPropertyOptional({ example: 'g' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  servingUnit?: string;

  @ApiPropertyOptional({ example: 165 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caloriesPer100g?: number;

  @ApiPropertyOptional({ example: 31 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinPer100g?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsPer100g?: number;

  @ApiPropertyOptional({ example: 3.6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fatPer100g?: number;
}

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}

export class FoodQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên (không phân biệt hoa thường)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ enum: FoodCategory })
  @IsOptional()
  @IsEnum(FoodCategory, { message: 'Nhóm thực phẩm không hợp lệ' })
  category?: FoodCategory;

  @ApiPropertyOptional({ description: 'Bao gồm cả thực phẩm đã ẩn (mặc định false)' })
  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

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
