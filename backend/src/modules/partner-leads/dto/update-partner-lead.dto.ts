import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { GYM_TIERS, PARTNER_LEAD_STATUSES, type PartnerLeadStatus } from '../partner-lead-workflow';

/** Admin cập nhật ghi chú nội bộ của một yêu cầu hợp tác */
export class UpdatePartnerLeadDto {
  @ApiPropertyOptional({ description: 'Ghi chú nội bộ của admin' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** Admin chuyển yêu cầu sang bước tiếp theo của quy trình */
export class TransitionPartnerLeadDto {
  @ApiProperty({ enum: PARTNER_LEAD_STATUSES, example: 'CONTACTED' })
  @IsIn(PARTNER_LEAD_STATUSES, { message: 'Trạng thái không hợp lệ' })
  status: PartnerLeadStatus;

  @ApiPropertyOptional({
    description: 'Kết quả/ghi chú của bước này (bắt buộc khi chốt hợp tác hoặc đóng yêu cầu)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Ghi chú tối đa 1000 ký tự' })
  note?: string;

  @ApiPropertyOptional({ description: 'Gửi email thông báo cho người liên hệ (khi đóng yêu cầu)' })
  @IsOptional()
  @IsBoolean()
  notifyPartner?: boolean;
}

/** Admin đánh giá hạng phòng gym sau khi xem ảnh / khảo sát cơ sở */
export class AssessPartnerLeadDto {
  @ApiProperty({ enum: GYM_TIERS, example: 'TIER_2' })
  @IsIn(GYM_TIERS, { message: 'Hạng phòng gym không hợp lệ' })
  tier: (typeof GYM_TIERS)[number];

  @ApiProperty({ description: 'Nhận xét cơ sở vật chất (căn cứ xếp hạng)' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng ghi nhận xét căn cứ xếp hạng' })
  @MaxLength(2000)
  note: string;
}
