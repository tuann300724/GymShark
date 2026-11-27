import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  FACILITY_PHOTO_AREAS,
  MAX_FACILITY_PHOTOS,
  MAX_PHOTO_DATA_URL_LENGTH,
} from '../partner-lead-workflow';

/** Một ảnh cơ sở vật chất (đã nén ở trình duyệt, gửi dạng data URL) */
export class PartnerLeadPhotoDto {
  @ApiProperty({ enum: FACILITY_PHOTO_AREAS, example: 'WEIGHTS' })
  @IsIn(FACILITY_PHOTO_AREAS, { message: 'Khu vực ảnh không hợp lệ' })
  area: (typeof FACILITY_PHOTO_AREAS)[number];

  @ApiPropertyOptional({ example: 'Khu tạ tự do 120m²' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  caption?: string;

  @ApiProperty({ description: 'data:image/jpeg;base64,...' })
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Ảnh phải là JPG, PNG hoặc WEBP',
  })
  @MaxLength(MAX_PHOTO_DATA_URL_LENGTH, { message: 'Ảnh quá lớn, vui lòng chọn ảnh khác' })
  dataUrl: string;
}

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

  @ApiPropertyOptional({
    type: [PartnerLeadPhotoDto],
    description: `Ảnh cơ sở vật chất — bắt buộc tối thiểu 3 ảnh với hướng COMMUNITY (tối đa ${MAX_FACILITY_PHOTOS})`,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FACILITY_PHOTOS, { message: `Tối đa ${MAX_FACILITY_PHOTOS} ảnh` })
  @ValidateNested({ each: true })
  @Type(() => PartnerLeadPhotoDto)
  photos?: PartnerLeadPhotoDto[];
}
