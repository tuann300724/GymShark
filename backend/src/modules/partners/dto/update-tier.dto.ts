import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { GYM_TIER_VALUES } from '../../../common/constants/db-enums';

/** Admin xếp hạng / đánh giá lại hạng phòng gym của đối tác */
export class UpdatePartnerTierDto {
  @ApiProperty({
    enum: GYM_TIER_VALUES,
    nullable: true,
    description: 'TIER_1 | TIER_2 | TIER_3, hoặc null để bỏ xếp hạng',
  })
  @ValidateIf((_, value) => value !== null)
  @IsIn(GYM_TIER_VALUES, { message: 'Hạng phòng gym không hợp lệ' })
  gymTier!: string | null;

  @ApiPropertyOptional({ description: 'Căn cứ xếp hạng (cơ sở vật chất, khảo sát...)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
