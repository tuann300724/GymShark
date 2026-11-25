import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Gender, TrainerStatus } from '../../../common/constants/db-enums';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTrainerDto {
  @ApiProperty({ example: 'HLV Nguyễn Văn Thể', description: 'Họ và tên huấn luyện viên' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName: string;

  @ApiProperty({ example: 'trainer5@gym.com', description: 'Email đăng nhập (được tạo tài khoản TRAINER)' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiPropertyOptional({ example: '0904567890', description: 'Số điện thoại' })
  @IsOptional()
  @Matches(/^[0-9+\-\s]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Giới tính' })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-03-20', description: 'Ngày sinh (ISO 8601)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng' })
  dateOfBirth?: string;

  @ApiProperty({ example: 'Tăng cơ giảm mỡ, Thể hình chuyên nghiệp', description: 'Chuyên môn chính' })
  @IsString()
  @MinLength(2, { message: 'Chuyên môn quá ngắn' })
  specialization: string;

  @ApiPropertyOptional({ example: 'ISSA Certified Personal Trainer', description: 'Chứng chỉ' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  certification?: string;

  @ApiPropertyOptional({ example: 5, description: 'Số năm kinh nghiệm' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số năm kinh nghiệm phải là số nguyên' })
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ description: 'Giới thiệu ngắn về HLV' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Phí kèm riêng (VND/buổi)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Phí kèm riêng phải là số' })
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ enum: TrainerStatus, default: TrainerStatus.ACTIVE })
  @IsOptional()
  @IsEnum(TrainerStatus, { message: 'Trạng thái không hợp lệ' })
  status?: TrainerStatus;
}

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {}

/**
 * HLV tự chỉnh hồ sơ công khai của mình — KHÔNG cho đổi email, SĐT,
 * trạng thái hay rating (những field này do quản trị viên quản lý).
 * `hourlyRate` là phí kèm riêng tính theo BUỔI, thanh toán riêng qua chat.
 */
export class UpdateMyTrainerProfileDto {
  @ApiPropertyOptional({ description: 'Chuyên môn chính' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  specialization?: string;

  @ApiPropertyOptional({ description: 'Chứng chỉ (để trống để xoá)' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  certification?: string;

  @ApiPropertyOptional({ description: 'Số năm kinh nghiệm' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @ApiPropertyOptional({ description: 'Giới thiệu bản thân' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ description: 'URL ảnh đại diện (để trống để xoá)' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Ngày sinh (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Phí kèm riêng (VND/buổi)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000000)
  hourlyRate?: number;
}

export class TrainerQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Tìm theo tên / email / SĐT' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: TrainerStatus, description: 'Lọc theo trạng thái HLV' })
  @IsOptional()
  @IsEnum(TrainerStatus)
  status?: TrainerStatus;

  @ApiPropertyOptional({ description: 'Lọc theo chuyên môn (chứa từ khóa)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  specialization?: string;
}