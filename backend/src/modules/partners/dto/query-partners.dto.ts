import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PARTNERSHIP_TYPES } from './partnership.dto';
import { Type } from 'class-transformer';
import { PartnerStatus } from '../../../common/constants/db-enums';

export class QueryPartnersDto {
  @ApiPropertyOptional({ example: 'Gym', description: 'Tìm theo tên doanh nghiệp / email / phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PartnerStatus })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiPropertyOptional({ enum: PARTNERSHIP_TYPES, description: 'Lọc theo loại hợp tác' })
  @IsOptional()
  @IsIn(PARTNERSHIP_TYPES)
  partnershipType?: (typeof PARTNERSHIP_TYPES)[number];

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
