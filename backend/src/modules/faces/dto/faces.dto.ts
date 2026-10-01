import {
  ArrayMaxSize,
  ArrayNotEmpty,
  Equals,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/** Ảnh chụp lúc đăng ký — chỉ nhận data URL JPEG/PNG/WebP base64 */
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
/** ~600.000 ký tự base64 ≈ 450KB ảnh gốc — quá lớn thì client đã resize sai */
const IMAGE_MAX_LENGTH = 600_000;

/**
 * POST /faces/enroll (hội viên tự đăng ký) và
 * POST /faces/member/:memberId/enroll (lễ tân đăng ký thay hội viên).
 *
 * Gửi vector embedding + (tùy chọn) ẢNH THAM CHIẾU chụp tại chỗ để lễ tân đối chiếu.
 * Ảnh là dữ liệu cá nhân nhạy cảm (NĐ13/2023) nên chỉ lưu khi có đồng ý tường minh.
 */
export class EnrollFaceDto {
  /** Các mẫu vector khuôn mặt (mỗi góc mặt 1 vector, tối đa 5 mẫu) */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5, { message: 'Chỉ được đăng ký tối đa 5 mẫu khuôn mặt mỗi lần.' })
  embeddings: number[][];

  /** Đồng ý tường minh việc xử lý dữ liệu sinh trắc học (bắt buộc) */
  @IsBoolean()
  @Equals(true, {
    message: 'Bạn phải đồng ý cho phép xử lý dữ liệu sinh trắc học để tiếp tục.',
  })
  consentGiven: boolean;

  /** Ảnh khuôn mặt tham chiếu (data URL base64, không bắt buộc) */
  @IsOptional()
  @IsString()
  @Matches(IMAGE_DATA_URL, {
    message: 'Ảnh khuôn mặt không hợp lệ (chỉ nhận data URL JPEG/PNG/WebP).',
  })
  @MaxLength(IMAGE_MAX_LENGTH, { message: 'Ảnh khuôn mặt quá lớn (tối đa ~450KB).' })
  imageData?: string;
}

/**
 * POST /faces/check-glasses — ảnh 1 khung hình camera để kiểm tra đeo kính.
 *
 * Ảnh này KHÔNG được lưu ở phía chúng ta: AzureFaceService chuyển tiếp nguyên byte
 * lên Azure AI Vision (xem service để hiểu vì sao). Chỉ nhận ảnh của chính người
 * đang đăng nhập / hội viên mà nhân viên đang làm thủ tục.
 */
export class CheckGlassesDto {
  @IsString()
  @Matches(IMAGE_DATA_URL, {
    message: 'Ảnh khuôn mặt không hợp lệ (chỉ nhận data URL JPEG/PNG/WebP).',
  })
  @MaxLength(IMAGE_MAX_LENGTH, { message: 'Ảnh khuôn mặt quá lớn (tối đa ~450KB).' })
  imageData: string;
}
