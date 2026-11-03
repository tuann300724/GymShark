/**
 * Định nghĩa tên event + payload cho hệ thống email nền (EventEmitter).
 *
 * Quy ước: business service chỉ `eventEmitter.emit(MAIL_EVENTS.X, payload)`
 * (KHÔNG await) → MailListener xử lý nền bằng sendSafe() — API trả kết quả
 * ngay, email đến sau 1-2 giây. Fail chỉ ghi log, không throw.
 */

export const MAIL_EVENTS = {
  /** Thanh toán đã xác nhận — gửi email xác nhận + hóa đơn PDF. */
  PAYMENT_CONFIRMED: 'mail.payment.confirmed',
  /** Hội viên sắp hết hạn gói (≤7 ngày) — job quét định kỳ phát ra. */
  MEMBERSHIP_EXPIRING: 'mail.membership.expiring',
  /** Hội viên đăng ký thành công (đã qua OTP) — gửi email chào mừng. */
  MEMBER_REGISTERED: 'mail.member.registered',
  /** Đăng ký buổi tập thành công — gửi email xác nhận xếp lịch. */
  SESSION_BOOKED: 'mail.session.booked',
} as const;

/** Payload event thanh toán đã xác nhận. */
export interface PaymentConfirmedMailEvent {
  userId: string;
  email: string;
  fullName: string;
  memberCode: string;
  invoiceNumber: string;
  packageName: string;
  /** Ngày hết hạn gói (nếu có) — hiển thị trên hóa đơn PDF. */
  membershipEndDate?: Date | null;
  amount: number;
  paidAt: Date;
  method: string;
}

/** Payload event hội viên sắp hết hạn. */
export interface MembershipExpiringMailEvent {
  userId: string;
  email: string;
  fullName: string;
  packageName: string;
  expiresAt: Date;
  daysLeft: number;
}

/** Payload event hội viên đăng ký thành công. */
export interface MemberRegisteredMailEvent {
  userId: string;
  email: string;
  fullName: string;
  memberCode: string;
}

/** Payload event đăng ký buổi tập thành công. */
export interface SessionBookedMailEvent {
  userId: string;
  email: string;
  fullName: string;
  title: string;
  startTime: Date;
  endTime: Date;
  roomName?: string | null;
  trainerName?: string | null;
}
