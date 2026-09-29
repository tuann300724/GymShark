import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '@prisma/client';

/**
 * DTO lễ tân/quản trị tạo hội viên mới tại quầy.
 * Tạo cả tài khoản (User) để hội viên đăng nhập + hồ sơ (Member).
 */
export class CreateMemberDto {
  @ApiProperty({ example: 'Nguyễn Thị Lan' })
  @IsString({ message: 'Họ và tên không được để trống' })
  @MinLength(2, { message: 'Họ và tên phải có tối thiểu 2 ký tự' })
  @MaxLength(100, { message: 'Họ và tên không được vượt quá 100 ký tự' })
  fullName: string;

  @ApiProperty({ example: 'lan.nguyen@gmail.com' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @MaxLength(120)
  email: string;

  @ApiProperty({ example: '0912345678' })
  @IsString({ message: 'Số điện thoại không được để trống' })
  @Matches(/^[0-9+\s.()-]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiPropertyOptional({
    description: 'Để trống = hệ thống sinh mật khẩu tạm, trả về 1 lần cho lễ tân đưa hội viên',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.MALE })
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
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Chi nhánh — mặc định lấy chi nhánh của nhân viên đang đăng nhập',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Chi nhánh không hợp lệ' })
  branchId?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn Ba - 0911222333' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContact?: string;
}
