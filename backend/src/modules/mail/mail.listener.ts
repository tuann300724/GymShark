import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from './mail.service';
import { InvoicePdfService } from './invoice-pdf.service';
import {
  MAIL_EVENTS,
  type MemberRegisteredMailEvent,
  type MembershipExpiringMailEvent,
  type PaymentConfirmedMailEvent,
  type SessionBookedMailEvent,
} from './mail.events';

/**
 * MailListener — xử lý email NHÓM B chạy nền (không chặn API).
 *
 * Luồng: business service emit event sau khi transaction DB thành công
 * (KHÔNG await) → listener này xử lý bất đồng bộ. Mọi handler đều:
 *   - gọi mailService.sendXxxEmail() (đi qua sendSafe — không throw);
 *   - bọc try/catch riêng cho bước sinh PDF (không để lỗi PDF giết handler);
 *   - chỉ ghi log — KHÔNG throw để không crash event pipeline.
 */
@Injectable()
export class MailListener {
  private readonly logger = new Logger('MailListener');

  constructor(
    private readonly mailService: MailService,
    private readonly pdfService: InvoicePdfService,
  ) {}

  private formatDate(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  /**
   * Thanh toán xác nhận → gửi email xác nhận + đính kèm hóa đơn PDF.
   * Trả `true` nếu đã gửi thành công, `false` nếu thất bại (đã ghi log) —
   * payments.service dùng để trả cờ `invoiceEmailSent` cho admin.
   */
  @OnEvent(MAIL_EVENTS.PAYMENT_CONFIRMED)
  async onPaymentConfirmed(payload: PaymentConfirmedMailEvent): Promise<boolean> {
    try {
      // Bước 1: sinh PDF (bọc riêng — PDF fail thì vẫn gửi được email xác nhận)
      let pdf: Buffer | null = null;
      try {
        // Nhãn thời lượng: "đến dd/mm/yyyy" nếu có ngày hết hạn
        const durationLabel = payload.membershipEndDate
          ? `Đến ${this.formatDate(payload.membershipEndDate)}`
          : 'Theo gói đã chọn';
        pdf = await this.pdfService.generateInvoicePdf({
          invoiceNumber: payload.invoiceNumber,
          issuedAt: payload.paidAt,
          memberName: payload.fullName,
          memberCode: payload.memberCode,
          email: payload.email,
          packageName: payload.packageName,
          durationLabel,
          amount: payload.amount,
          method: payload.method,
          paidAt: payload.paidAt,
        });
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        this.logger.warn(`Sinh PDF hóa đơn ${payload.invoiceNumber} thất bại: ${detail}`);
      }

      // Bước 2: gửi email (PDF kèm nếu có)
      if (pdf) {
        return await this.mailService.sendInvoiceEmail({
          email: payload.email,
          fullName: payload.fullName,
          invoiceNumber: payload.invoiceNumber,
          packageName: payload.packageName,
          amount: payload.amount,
          issuedAt: payload.paidAt,
          pdf,
        });
      }
      // Không có PDF → vẫn gửi email xác nhận thuần
      return await this.mailService.sendPaymentConfirmedEmail({
        email: payload.email,
        fullName: payload.fullName,
        invoiceNumber: payload.invoiceNumber,
        packageName: payload.packageName,
        amount: payload.amount,
        paidAt: payload.paidAt,
        method: payload.method,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`MailListener.onPaymentConfirmed lỗi (payload=${payload.invoiceNumber}): ${detail}`);
      return false;
    }
  }

  /** Hội viên sắp hết hạn → gửi email nhắc gia hạn. */
  @OnEvent(MAIL_EVENTS.MEMBERSHIP_EXPIRING)
  async onMembershipExpiring(payload: MembershipExpiringMailEvent): Promise<void> {
    try {
      await this.mailService.sendMembershipExpiringEmail({
        email: payload.email,
        fullName: payload.fullName,
        packageName: payload.packageName,
        expiresAt: payload.expiresAt,
        daysLeft: payload.daysLeft,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`MailListener.onMembershipExpiring lỗi (payload=${payload.email}): ${detail}`);
    }
  }

  /** Hội viên đăng ký thành công → gửi email chào mừng. */
  @OnEvent(MAIL_EVENTS.MEMBER_REGISTERED)
  async onMemberRegistered(payload: MemberRegisteredMailEvent): Promise<void> {
    try {
      await this.mailService.sendWelcomeEmail({
        email: payload.email,
        fullName: payload.fullName,
        memberCode: payload.memberCode,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`MailListener.onMemberRegistered lỗi (payload=${payload.email}): ${detail}`);
    }
  }

  /** Đăng ký buổi tập thành công → gửi email xác nhận xếp lịch. */
  @OnEvent(MAIL_EVENTS.SESSION_BOOKED)
  async onSessionBooked(payload: SessionBookedMailEvent): Promise<void> {
    try {
      await this.mailService.sendBookingConfirmedEmail({
        email: payload.email,
        fullName: payload.fullName,
        title: payload.title,
        startTime: payload.startTime,
        endTime: payload.endTime,
        roomName: payload.roomName,
        trainerName: payload.trainerName,
      });
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`MailListener.onSessionBooked lỗi (payload=${payload.email}): ${detail}`);
    }
  }
}
