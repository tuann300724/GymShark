import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExtendMembershipDto {
  @ApiProperty({ example: 30, description: 'Số ngày gia hạn (> 0)' })
  @Type(() => Number)
  @IsInt({ message: 'Số ngày phải là số nguyên' })
  @Min(1, { message: 'Số ngày phải lớn hơn 0' })
  @Max(3650, { message: 'Số ngày quá lớn' })
  days: number;

  @ApiPropertyOptional({ example: 'Ưu đãi giữ chân khách hàng' })
  @IsOptional()
  @IsString()
  reason?: string;
}