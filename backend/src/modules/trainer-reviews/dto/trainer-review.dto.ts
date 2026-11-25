import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateTrainerReviewDto {
  @ApiProperty({ description: 'ID huấn luyện viên được đánh giá' })
  @IsString()
  @Matches(UUID_PATTERN, { message: 'ID huấn luyện viên không hợp lệ' })
  trainerId!: string;

  @ApiProperty({ minimum: 1, maximum: 5, description: 'Điểm đánh giá 1–5 sao' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'Bình luận (tối đa 2000 ký tự)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class UpdateTrainerReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Bình luận (tối đa 2000 ký tự)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

export class TrainerReviewQueryDto {
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
