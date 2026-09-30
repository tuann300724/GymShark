import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/** Gửi lại mã xác minh cho một yêu cầu đăng ký đang chờ (không cần nhập lại mật khẩu). */
export class ResendMemberVerifyCodeDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đang chờ xác minh' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
