import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'staff2@gym.com', description: 'Email đăng ký' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'Mật khẩu bảo mật' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Lê Văn An', description: 'Họ và tên nhân viên/quản lý' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.STAFF, description: 'Vai trò trong hệ thống' })
  @IsOptional()
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role?: Role;

  @ApiPropertyOptional({ description: 'ID chi nhánh trực thuộc' })
  @IsOptional()
  branchId?: string;
}
