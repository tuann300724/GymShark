import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/** Hướng hợp tác đối tác chọn trên 2 thẻ (owner = phòng gym riêng, community = cộng đồng) */
export const PARTNER_LEAD_DIRECTIONS = ['OWNER', 'COMMUNITY'] as const;

/**
 * CreatePartnerLeadDto — 5 trường của form đăng ký đối tác mới.
 * KHÔNG tạo tài khoản: chỉ lưu yêu cầu để admin tự liên hệ sau.
 */
export class CreatePartnerLeadDto {
  @ApiProperty({
    enum: PARTNER_LEAD_DIRECTIONS,
    description: 'Hướng hợp tác do đối tác chọn trên trang đăng ký',
  })
  @IsIn(PARTNER_LEAD_DIRECTIONS)
  direction: (typeof PARTNER_LEAD_DIRECTIONS)[number];

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Tên người liên hệ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  contactName: string;

  @ApiPropertyOptional({ example: '123 Lê Lợi, Quận 1, TP. Hồ Chí Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  address?: string;

  @ApiProperty({ example: 'chuphonggym@gmail.com' })
  @IsEmail()
  @MaxLength(400)
  email: string;

  @ApiProperty({ example: '0912345678' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @ApiPropertyOptional({
    example: 'Tôi muốn tìm hiểu thêm về hướng hợp tác cộng đồng...',
    description: 'Thông tin muốn trao đổi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;
}
