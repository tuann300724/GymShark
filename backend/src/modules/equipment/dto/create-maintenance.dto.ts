import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateMaintenanceDto {
  @IsNotEmpty({ message: 'Vui lòng nhập mô tả sự cố hoặc nội dung bảo trì' })
  @IsString()
  description: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày dự kiến sửa xong không hợp lệ' })
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateMaintenanceDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày dự kiến sửa xong không hợp lệ' })
  endDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
