import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePartnerProfileDto {
  @ApiProperty({ example: 'Phòng Gym ABC', description: 'Tên doanh nghiệp' })
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  @IsString()
  @MaxLength(400)
  businessName: string;

  @ApiPropertyOptional({ example: '0312345678', description: 'Mã số thuế' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  taxCode?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  phone?: string;

  @ApiPropertyOptional({ example: 'partner@gym.com', description: 'Email liên hệ' })
  @IsOptional()
  @IsEmail()
  @MaxLength(400)
  email?: string;

  @ApiPropertyOptional({ example: '123 Lê Lợi, Quận 1, TP.HCM', description: 'Địa chỉ chính' })
  @IsOptional()
  @IsString()
  address?: string;
}