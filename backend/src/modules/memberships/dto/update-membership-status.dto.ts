import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MembershipStatus } from '@prisma/client';

export class UpdateMembershipStatusDto {
  @ApiProperty({ enum: MembershipStatus, example: 'SUSPENDED' })
  @IsNotEmpty({ message: 'Vui lòng chọn trạng thái' })
  @IsEnum(MembershipStatus, { message: 'Trạng thái không hợp lệ' })
  status: MembershipStatus;

  @ApiPropertyOptional({ example: 'Khách yêu cầu tạm giữ thẻ 1 tháng' })
  @IsOptional()
  @IsString()
  reason?: string;
}