import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateEquipmentDto {
  @IsNotEmpty({ message: 'Tên thiết bị không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Mã thiết bị không được để trống' })
  @IsString()
  code: string;

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
