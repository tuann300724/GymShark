import { ArrayMaxSize, ArrayNotEmpty, Equals, IsArray, IsBoolean } from 'class-validator';

/**
 * POST /faces/enroll — hội viên đăng ký dữ liệu khuôn mặt.
 * Chỉ nhận VECTOR (mảng số), KHÔNG nhận ảnh gốc — tuân thủ Nghị định 13/2023.
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
}
