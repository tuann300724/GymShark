import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateEquipmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
