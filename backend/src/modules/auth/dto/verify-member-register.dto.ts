import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

/**
 * Bước 2 — xác minh mã 6 số đã gửi qua email để hoàn tất đăng ký hội viên.
 * Chỉ khi mã đúng + còn hạn thì hệ thống mới tạo User + Member thật.
 */
export class VerifyMemberRegisterDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đã dùng để yêu cầu mã' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã xác minh 6 chữ số gửi qua email' })
  @IsNotEmpty({ message: 'Mã xác minh không được để trống' })
  @Matches(/^\d{6}$/, { message: 'Mã xác minh phải gồm đúng 6 chữ số' })
  code: string;
}
