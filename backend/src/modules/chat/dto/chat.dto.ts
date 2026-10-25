import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../../../common/constants/db-enums';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Ảnh/tệp đính kèm phải là data URL hợp lệ (dự án không có dịch vụ lưu trữ tập tin). */
const DATA_URL_PATTERN = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/]+=*$/i;

export class AttachmentInputDto {
  @ApiProperty({ description: 'Nội dung tệp dạng data URL base64' })
  @IsString()
  @MaxLength(3_500_000, { message: 'Tệp đính kèm quá lớn' })
  @Matches(DATA_URL_PATTERN, { message: 'Tệp đính kèm phải là data URL base64 hợp lệ' })
  dataUrl!: string;

  @ApiPropertyOptional({ enum: ['IMAGE', 'FILE'] })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  kind?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  width?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  height?: number;
}

export class SendMessageDto {
  @ApiPropertyOptional({ enum: MessageType, description: 'TEXT hoặc IMAGE (mặc định suy ra từ attachments)' })
  @IsOptional()
  @IsEnum(MessageType, { message: 'Loại tin nhắn không hợp lệ' })
  type?: MessageType;

  @ApiPropertyOptional({ description: 'Nội dung văn bản' })
  @IsOptional()
  @IsString()
  @MaxLength(4000, { message: 'Nội dung tin nhắn quá dài' })
  content?: string;

  @ApiPropertyOptional({ type: [AttachmentInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4, { message: 'Tối đa 4 tệp mỗi tin nhắn' })
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[];
}

export class MessageQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class StartConversationDto {
  @ApiProperty({ description: 'ID hội viên (phải đang được phân công cho HLV này)' })
  @IsString()
  memberId!: string;
}

export class ConversationQueryDto {
  @ApiPropertyOptional({ description: 'Tìm theo tên hội viên (chỉ áp dụng cho HLV)' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({ description: 'Chỉ hiện hội thoại có tin chưa đọc' })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
