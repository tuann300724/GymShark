import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SendProgramDto {
  @ApiPropertyOptional({ description: 'Lời nhắn đính kèm (tùy chọn) — luôn kèm danh sách bài tập đầy đủ' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID hội viên được PT chọn nhận bài (bắt buộc chọn ít nhất 1 — chỉ nhận hội viên ACTIVE)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  memberIds?: string[];
}
