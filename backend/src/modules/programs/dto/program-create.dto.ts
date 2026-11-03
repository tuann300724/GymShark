import { IsArray, IsBoolean, IsOptional, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgramExerciseItemDto {
  @ApiProperty({ description: 'ID bài tập' })
  @IsString()
  exerciseId: string;

  @ApiPropertyOptional({ description: 'Số hiệp (sets)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @ApiPropertyOptional({ description: 'Số lần (reps)', required: false })
  @IsOptional()
  @IsInt()
  reps?: number;

  @ApiPropertyOptional({ description: 'Thời gian nghỉ giữa các hiệp (giây)', required: false })
  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @ApiPropertyOptional({ description: 'Thứ tự hiển thị của bài tập (0 = tự động theo thứ tự thêm)', required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateProgramDto {
  @ApiProperty({ description: 'Slug định danh của buổi tập' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Tên buổi tập' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Nhóm phân loại (vd: Lưng xô / Tay trước)', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'Thời lượng buổi tập (phút)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Mô tả ngắn gọn' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Ảnh minh họa của buổi tập' })
  @IsOptional()
  @IsString()
  img?: string;

  @ApiPropertyOptional({ description: 'Văn bản thay thế cho ảnh (alt)' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'Đánh dấu lưu làm mẫu (template)' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiProperty({ description: 'Danh sách bài tập trong buổi tập (exerciseId, sets, reps, restSeconds, order)', type: [ProgramExerciseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramExerciseItemDto)
  exercises: ProgramExerciseItemDto[];
}
