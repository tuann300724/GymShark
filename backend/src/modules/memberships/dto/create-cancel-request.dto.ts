import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Hội viên gửi yêu cầu hủy gói đang hoạt động (chờ admin duyệt) */
export class CreateCancelRequestDto {
  @ApiPropertyOptional({
    example: 'Chuyển chỗ nên không tập nữa',
    description: 'Lý do hủy gói (tối đa 500 ký tự)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
  reason?: string;
}
