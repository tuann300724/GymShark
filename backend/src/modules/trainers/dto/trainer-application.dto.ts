import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Gender } from '../../../common/constants/db-enums';
import {
  AVATAR_DATA_URL_PATTERN,
  MAX_AVATAR_DATA_URL_LENGTH,
} from '../../../common/utils/avatar';

/** Số ảnh bằng cấp tối thiểu / tối đa mỗi đơn (mỗi ảnh ≤ ~500KB sau nén, body JSON ≤ 4MB) */
export const MIN_TRAINER_DOCUMENTS = 1;
export const MAX_TRAINER_DOCUMENTS = 4;
/** ~500KB dữ liệu ảnh sau base64 — khớp MAX_DATA_URL ở frontend */
const MAX_DOCUMENT_DATA_URL_LENGTH = 700_000;

export const TRAINER_APPLICATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

/** Một ảnh bằng cấp / chứng chỉ (đã nén ở trình duyệt, gửi dạng data URL) */
export class TrainerApplicationDocumentDto {
  @ApiPropertyOptional({ example: 'Chứng chỉ ISSA CPT' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  caption?: string;

  @ApiProperty({ description: 'data:image/jpeg;base64,...' })
  @IsString()
  @Matches(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/, {
    message: 'Ảnh bằng cấp phải là JPG, PNG hoặc WEBP',
  })
  @MaxLength(MAX_DOCUMENT_DATA_URL_LENGTH, { message: 'Ảnh quá lớn, vui lòng chọn ảnh khác' })
  dataUrl: string;
}

/**
 * Đơn đăng ký làm PT tự do (công khai, miễn phí) — giống đăng ký đối tác:
 * KHÔNG tạo tài khoản ngay; admin duyệt xong hệ thống mới tạo tài khoản và gửi mật khẩu tạm.
 */
export class CreateTrainerApplicationDto {
  @ApiProperty({ example: 'Nguyễn Văn Thể' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  @MaxLength(120, { message: 'Họ tên quá dài' })
  fullName: string;

  @ApiProperty({ example: 'pt.the@gmail.com', description: 'Email nhận kết quả + đăng nhập sau khi duyệt' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(200)
  email: string;

  @ApiProperty({ example: '0904567890' })
  @Matches(/^[0-9+\-\s]{9,15}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @ApiProperty({ example: 'Tăng cơ giảm mỡ' })
  @IsString()
  @MinLength(2, { message: 'Chuyên môn quá ngắn' })
  @MaxLength(400)
  specialization: string;

  @ApiPropertyOptional({ example: 'ISSA Certified Personal Trainer' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  certification?: string;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt({ message: 'Số năm kinh nghiệm phải là số nguyên' })
  @Min(0)
  @Max(60)
  experienceYears: number;

  @ApiProperty({ description: 'Giới thiệu bản thân (tối thiểu 30 ký tự)' })
  @IsString()
  @MinLength(30, { message: 'Phần giới thiệu cần ít nhất 30 ký tự để admin thẩm định' })
  @MaxLength(2000)
  bio: string;

  @ApiPropertyOptional({ description: 'Ảnh đại diện tải lên (data:image/jpeg;base64,...)' })
  @IsOptional()
  @IsString()
  @Matches(AVATAR_DATA_URL_PATTERN, { message: 'Ảnh đại diện phải là JPG, PNG hoặc WEBP' })
  @MaxLength(MAX_AVATAR_DATA_URL_LENGTH, { message: 'Ảnh đại diện quá lớn, vui lòng chọn ảnh khác' })
  avatarUrl?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  gender?: Gender;

  @ApiPropertyOptional({ example: 300000, description: 'Phí kèm riêng dự kiến (VND/buổi)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Phí kèm riêng phải là số' })
  @Min(0)
  @Max(1000000000)
  hourlyRate?: number;

  @ApiProperty({ type: [TrainerApplicationDocumentDto], description: 'Ảnh bằng cấp / chứng chỉ' })
  @IsArray()
  @ArrayMinSize(MIN_TRAINER_DOCUMENTS, {
    message: 'Vui lòng tải lên ít nhất 1 ảnh bằng cấp hoặc chứng chỉ',
  })
  @ArrayMaxSize(MAX_TRAINER_DOCUMENTS, { message: `Tối đa ${MAX_TRAINER_DOCUMENTS} ảnh` })
  @ValidateNested({ each: true })
  @Type(() => TrainerApplicationDocumentDto)
  documents: TrainerApplicationDocumentDto[];
}

export class TrainerApplicationQueryDto {
  @ApiPropertyOptional({ enum: TRAINER_APPLICATION_STATUSES, default: 'PENDING' })
  @IsOptional()
  @IsIn(TRAINER_APPLICATION_STATUSES)
  status?: (typeof TRAINER_APPLICATION_STATUSES)[number];
}
