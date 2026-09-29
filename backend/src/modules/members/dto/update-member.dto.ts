import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Gender, MemberStatus } from '@prisma/client';

/** DTO dành riêng cho Admin/Staff cập nhật hồ sơ hoặc trạng thái hội viên */
export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'Trần Minh Quân' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'member@gym.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ example: '1998-05-15' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Phường Tân Tiến, TP. Biên Hòa' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn Ba - 0911222333' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Ghi chú nội bộ' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  /** ACTIVE | INACTIVE | SUSPENDED — admin khóa/kích hoạt hội viên */
  @ApiPropertyOptional({ enum: MemberStatus })
  @IsOptional()
  @IsEnum(MemberStatus, { message: 'Trạng thái không hợp lệ' })
  status?: MemberStatus;
}