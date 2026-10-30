import { IsArray, IsBoolean, IsOptional, IsString, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProgramExerciseItemDto {
  @ApiProperty({ description: 'Id bÃ i tÃªm' })
  @IsString()
  exerciseId: string;

  @ApiPropertyOptional({ description: 'SÃ¡t luyá»‘n', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  sets?: number;

  @ApiPropertyOptional({ description: 'LÃºyá»“t', required: false })
  @IsOptional()
  @IsInt()
  reps?: number;

  @ApiPropertyOptional({ description: 'ThÃ g giÃ¬i', required: false })
  @IsOptional()
  @IsInt()
  restSeconds?: number;

  @ApiPropertyOptional({ description: 'ThÃ ng hÃ­nh (0 = cÃ¡ch cÃ y theo thÃ ng kÃ©o vÃ eo)', required: false })
  @IsOptional()
  @IsInt()
  order?: number;
}

export class CreateProgramDto {
  @ApiProperty({ description: 'Slug tÃ¬nh danh' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'TÃªn bÃ i tÃªm' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'NhÃªn nhÃ£n kÃ¶ thÃºc vÃ o bÃ i tÃªm', required: false })
  @IsOptional()
  @IsString()
  group?: string;

  @ApiPropertyOptional({ description: 'ThÃ g sÃ¡t (tuÃ i mÃºt)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'MÃ¬nh nghÃ­a' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'HÌ¹nhÃ nh vÃ o bÃ i tÃªm' })
  @IsOptional()
  @IsString()
  img?: string;

  @ApiPropertyOptional({ description: 'Trang vÃ eo bÃ i tÃªm' })
  @IsOptional()
  @IsString()
  alt?: string;

  @ApiPropertyOptional({ description: 'NgÆ°á»©ng hÃ ng ngÃ¼a (ặng bài tÃ m lÃºi)' })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;

  @ApiProperty({ description: 'CÃ¡c bÃ i tÃªm nÃ³i lÃºi', type: [ProgramExerciseItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramExerciseItemDto)
  exercises: ProgramExerciseItemDto[];
}
