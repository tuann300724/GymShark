import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

/** Bước 2 quên mật khẩu — nhập mã 6 số + mật khẩu mới. */
export class ResetPasswordDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đã đăng ký tài khoản' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã 6 số nhận qua email' })
  @IsString({ message: 'Mã xác minh không hợp lệ' })
  @Length(6, 6, { message: 'Mã xác minh gồm đúng 6 chữ số' })
  code: string;

  @ApiProperty({ example: 'NewPassword@123', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(6, { message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' })
  newPassword: string;
}
