import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/** Dùng cho cả tạo mới và cập nhật chi nhánh của chính đối tác. */
export class PartnerBranchDto {
  @ApiProperty({ example: 'Gym Alpha', description: 'Tên chi nhánh phòng gym' })
  @IsNotEmpty({ message: 'Tên chi nhánh không được để trống' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '123 Lê Lợi, Quận 1, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 10.76, description: 'Vĩ độ' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 106.7, description: 'Kinh độ' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
