import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/** Bước 1 quên mật khẩu — gửi mã 6 số về email đã đăng ký. */
export class ForgotPasswordDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đã đăng ký tài khoản' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
