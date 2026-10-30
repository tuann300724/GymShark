import { IsString, IsOptional } from 'class-validator';
export class CreateExerciseDto {
  @IsString() name: string;
  @IsOptional() @IsString() enName?: string;
  @IsString() group: string;
  @IsOptional() @IsString() equipment?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
}
