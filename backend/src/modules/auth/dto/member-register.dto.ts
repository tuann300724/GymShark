import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Gender } from '@prisma/client';

export class MemberRegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên hội viên' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đăng ký' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '0912345678', description: 'Số điện thoại' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @IsString({ message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: 'Password@123', description: 'Mật khẩu (tối thiểu 6 ký tự)' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password: string;

  @ApiPropertyOptional({ example: '2000-01-15', description: 'Ngày sinh (ISO 8601)' })
  @IsOptional()
  @IsISO8601({}, { message: 'Ngày sinh không đúng định dạng' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, default: Gender.MALE, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Quận 9, TP. Hồ Chí Minh', description: 'Địa chỉ liên hệ' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn B - 0901234567', description: 'Người liên hệ khẩn cấp' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;
}