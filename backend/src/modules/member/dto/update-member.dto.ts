import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, Matches } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsOptional()
  @IsString({ message: 'Họ và tên không hợp lệ' })
  fullName?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại' })
  @IsOptional()
  @Matches(/^[0-9+\-\s]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ example: '2000-01-15', description: 'Ngày sinh (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày sinh không đúng định dạng' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Quận 9, TP. Hồ Chí Minh', description: 'Địa chỉ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn B - 0901234567', description: 'Người liên hệ khẩn cấp' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}