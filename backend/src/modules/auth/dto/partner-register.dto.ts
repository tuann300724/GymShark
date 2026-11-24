import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class PartnerRegisterDto {
  @ApiProperty({ example: 'partner@example.com', description: 'Email chủ sở hữu' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'Partner@123', description: 'Mật khẩu tài khoản' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Trần Thị B', description: 'Họ tên chủ sở hữu' })
  @IsNotEmpty({ message: 'Họ tên chủ sở hữu không được để trống' })
  ownerName: string;

  @ApiProperty({ example: 'Phòng Gym ABC', description: 'Tên phòng gym/doanh nghiệp' })
  @IsNotEmpty({ message: 'Tên doanh nghiệp không được để trống' })
  businessName: string;

  @ApiPropertyOptional({ example: '0312345678', description: 'Mã số thuế' })
  @IsOptional()
  taxCode?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại liên hệ' })
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Lê Lợi, Quận 1, TP.HCM', description: 'Địa chỉ doanh nghiệp' })
  @IsOptional()
  address?: string;
}