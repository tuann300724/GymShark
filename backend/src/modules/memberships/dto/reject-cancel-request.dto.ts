import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Admin từ chối yêu cầu hủy gói — gói tiếp tục hoạt động bình thường */
export class RejectCancelRequestDto {
  @ApiPropertyOptional({ example: 'Vui lòng liên hệ lễ tân để được hỗ trợ' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do tối đa 500 ký tự' })
  reason?: string;
}
