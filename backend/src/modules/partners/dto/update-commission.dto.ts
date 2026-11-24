import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateCommissionDto {
  @ApiProperty({
    description: 'Tỷ lệ hoa hồng tính trên mỗi lượt tập, theo phần trăm (0..100)',
    example: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate!: number;
}
