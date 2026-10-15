import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface MemberQrPayload {
  memberId: string;
  memberCode: string;
}

/**
 * Mã QR hội viên — token HMAC-SHA256 mang danh tính hội viên, không mang quyền.
 *
 * Vì sao KHÔNG dùng mã hội viên thuần (MEM-0003): mã thẻ hiển thị công khai trên
 * mọi hoá đơn, lịch sử thanh toán và biển tên; nếu QR là mã thẻ thì ai nhìn thấy
 * tên hội viên là check-in được thay người đó. Ký HMAC thì người đọc chỉ thấy
 * một chuỗi vô nghĩa và sửa không được.
 *
 * Vì sao KHÔNG dùng JWT: JWT nhét `iat` nên mỗi lần tải trang là một chuỗi khác
 * → hội viên chụp màn hình hôm nay và ảnh thẻ ngày mai không giống nhau, không
 * in được thẻ giấy. Token ở đây cố định cho từng hội viên nên QR "một tấm, dùng
 * mãi" — đúng đặc tính của thẻ ra vào.
 *
 * Token không hết hạn và không cấp quyền gọi API: bản chất nó là "thẻ giấy" —
 * rò rỉ thì kẻ khác check-in thay hội viên, không lấy được dữ liệu hay tiền.
 * Hội viên có thể tự rút lui/thu hồi bằng cách đổi trạng thái thẻ ở trang quản trị.
 *
 * Cấu trúc: `<memberId>.<memberCode>.<chữ ký base64url 32 ký tự>`.
 */
@Injectable()
export class MemberQrService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    // Dùng chung khoá JWT_SECRET — đã là bí mật mạnh và đã có sẵn trong .env.
    // (Cũng là lý do token QR không ký được nếu đổi khoá: phải phát lại thẻ.)
    this.secret =
      config.get<string>('JWT_SECRET') || 'gym_management_super_secret_jwt_key_2026_lhu_grad';
  }

  /** Ký token QR cho một hội viên. Cùng hội viên → cùng chuỗi (deterministic). */
  sign(payload: MemberQrPayload): string {
    const body = `${payload.memberId}.${payload.memberCode}`;
    return `${body}.${this.signature(body)}`;
  }

  /**
   * Xác minh chữ ký. Trả về payload nếu hợp lệ, `null` nếu sai chữ ký hoặc sai định dạng.
   * So sánh bằng `timingSafeEqual` để không rò thời gian so khớp.
   */
  verify(token: string | undefined | null): MemberQrPayload | null {
    const trimmed = typeof token === 'string' ? token.trim() : '';
    // memberId là uuid (36 ký tự) + memberCode (dãn mã) — chuỗi ngắn hơn thì bỏ qua
    if (trimmed.length < 50) return null;

    const lastDot = trimmed.lastIndexOf('.');
    if (lastDot <= 0) return null;

    const body = trimmed.slice(0, lastDot);
    const givenSignature = trimmed.slice(lastDot + 1);
    const expected = this.signature(body);

    if (givenSignature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(givenSignature), Buffer.from(expected))) return null;

    const [memberId, memberCode] = body.split('.');
    if (!memberId || !memberCode) return null;

    return { memberId, memberCode };
  }

  private signature(body: string): string {
    return crypto.createHmac('sha256', this.secret).update(body).digest('base64url').slice(0, 32);
  }
}
