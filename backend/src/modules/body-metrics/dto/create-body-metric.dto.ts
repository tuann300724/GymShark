import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Ghi 1 bản ghi số đo cơ thể — chỉ cần điền tối thiểu 1 chỉ số
 * (service sẽ kiểm tra, không nhận bản ghi toàn trống).
 */
export class CreateBodyMetricDto {
  @ApiPropertyOptional({ example: 72.5, description: 'Cân nặng (kg)' })
  @IsOptional()
  @IsNumber({}, { message: 'Cân nặng không hợp lệ' })
  @Min(20, { message: 'Cân nặng tối thiểu 20 kg' })
  @Max(300, { message: 'Cân nặng tối đa 300 kg' })
  weightKg?: number;

  @ApiPropertyOptional({ example: 18.5, description: 'Tỷ lệ mỡ cơ thể (%)' })
  @IsOptional()
  @IsNumber({}, { message: 'Tỷ lệ mỡ không hợp lệ' })
  @Min(1, { message: 'Tỷ lệ mỡ tối thiểu 1%' })
  @Max(80, { message: 'Tỷ lệ mỡ tối đa 80%' })
  bodyFatPercent?: number;

  @ApiPropertyOptional({ example: 78, description: 'Vòng eo (cm)' })
  @IsOptional()
  @IsNumber({}, { message: 'Vòng eo không hợp lệ' })
  @Min(30, { message: 'Vòng eo tối thiểu 30 cm' })
  @Max(250, { message: 'Vòng eo tối đa 250 cm' })
  waistCm?: number;

  @ApiPropertyOptional({ example: 95, description: 'Vòng ngực (cm)' })
  @IsOptional()
  @IsNumber({}, { message: 'Vòng ngực không hợp lệ' })
  @Min(30, { message: 'Vòng ngực tối thiểu 30 cm' })
  @Max(250, { message: 'Vòng ngực tối đa 250 cm' })
  chestCm?: number;

  @ApiPropertyOptional({ example: 32, description: 'Vòng bắp tay (cm)' })
  @IsOptional()
  @IsNumber({}, { message: 'Vòng bắp tay không hợp lệ' })
  @Min(10, { message: 'Vòng bắp tay tối thiểu 10 cm' })
  @Max(100, { message: 'Vòng bắp tay tối đa 100 cm' })
  armCm?: number;

  @ApiPropertyOptional({ example: 55, description: 'Vòng đùi (cm)' })
  @IsOptional()
  @IsNumber({}, { message: 'Vòng đùi không hợp lệ' })
  @Min(20, { message: 'Vòng đùi tối thiểu 20 cm' })
  @Max(150, { message: 'Vòng đùi tối đa 150 cm' })
  thighCm?: number;

  @ApiPropertyOptional({ example: 'Sau buổi cardio sáng', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Ghi chú tối đa 500 ký tự' })
  note?: string;

  @ApiPropertyOptional({ description: 'Ngày đo (ISO 8601), mặc định hôm nay' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày đo không hợp lệ' })
  recordedAt?: string;
}
