import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { memberVerificationCodeEmail, passwordResetCodeEmail } from './email-templates';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * MailService — kênh gửi email ra ngoài hệ thống (hiện phục vụ mã xác minh
 * đăng ký hội viên).
 *
 * Cấu hình qua biến môi trường (xem .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_REQUIRE_TLS, MAIL_FROM_NAME
 *   (địa chỉ From lấy luôn từ SMTP_USER — không có biến riêng cho địa chỉ From)
 *
 * Hợp đồng quan trọng — KHÁC với AuditService (best-effort, nuốt lỗi):
 *   send() ném lỗi khi gửi thất bại để nghiệp vụ gọi nó có thể dừng lại.
 *   Đăng ký hội viên phải bị chặn nếu mã xác minh không tới được người dùng —
 *   nếu nuốt lỗi thì hệ thống sẽ tạo tài khoản mà người đó không kiểm soát được email.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger('MailService');
  private transporter: Transporter | null = null;
  private fromAddress: string | null = null;
  private lastConfigError: string | null = null;
  private readonly requireTls: boolean;

  constructor(private readonly config: ConfigService) {
    this.requireTls = this.config.get<string>('SMTP_REQUIRE_TLS') !== 'false';
  }

  onModuleInit(): void {
    this.transporter = this.buildTransporter();
    if (this.transporter) {
      const user = this.config.get<string>('SMTP_USER');
      this.logger.log(`Đã sẵn sàng gửi email qua SMTP (tài khoản: ${user})`);
    } else {
      this.logger.warn(
        'Chưa cấu hình SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) — mọi chức năng cần gửi email sẽ báo lỗi cho người dùng.',
      );
    }
  }

  /** true = đã cấu hình đủ để gửi email thật */
  isConfigured(): boolean {
    return this.transporter !== null;
  }

  /**
   * Gửi một email. Ném ServiceUnavailableException (503) khi chưa cấu hình hoặc
   * SMTP trả lỗi — nội dung lỗi trả về client là thông báo tiếng Việt thân thiện,
   * chi tiết kỹ thuật chỉ ghi vào log backend (không rò rỉ cấu hình SMTP).
   */
  async send(options: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.error(`Gửi email thất bại (chưa cấu hình SMTP): ${this.lastConfigError}`);
      throw new ServiceUnavailableException(
        'Hệ thống chưa cấu hình dịch vụ gửi email. Vui lòng liên hệ quản trị viên.',
      );
    }

    const fromName = this.config.get<string>('MAIL_FROM_NAME') || 'GymMaster Pro';

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Đã gửi email "${options.subject}" tới ${options.to}`);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`Không gửi được email tới ${options.to}: ${detail}`);
      throw new ServiceUnavailableException(
        'Không gửi được mã xác minh. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.',
      );
    }
  }

  /**
   * Gửi mã xác minh 6 số cho bước đăng ký hội viên.
   * Đây là hàm nghiệp vụ duy nhất của MailService — mọi nơi khác muốn gửi mail
   * sẽ bổ sung hàm tương tự để template HTML tập trung ở email-templates.ts.
   */
  async sendMemberVerificationCode(params: {
    email: string;
    fullName: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const mail = memberVerificationCodeEmail(params);
    await this.send({ to: params.email, ...mail });
  }

  /** Gửi mã đặt lại mật khẩu 6 số (luồng quên mật khẩu). */
  async sendPasswordResetCode(params: {
    email: string;
    fullName: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void> {
    const mail = passwordResetCodeEmail(params);
    await this.send({ to: params.email, ...mail });
  }

  /** Dựng transporter từ biến môi trường; trả về null + ghi log nếu thiếu cấu hình. */
  private buildTransporter(): Transporter | null {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS')?.trim();

    if (!host || !user || !pass) {
      this.lastConfigError = 'thiếu SMTP_HOST hoặc SMTP_USER hoặc SMTP_PASS';
      return null;
    }

    const port = Number(this.config.get<string>('SMTP_PORT')) || 587;
    // Gmail dùng STARTTLS trên 587; cổng 465 thì bật TLS ngay từ đầu (SMTP_SECURE=true)
    const secure = this.config.get<string>('SMTP_SECURE')
      ? this.config.get<string>('SMTP_SECURE') === 'true'
      : port === 465;

    this.fromAddress = user;

    return nodemailer.createTransport({
      host,
      port,
      secure,
      // Bắt buộc nâng cấp STARTTLS (đúng chuẩn cho Gmail cổng 587). Đặt
      // SMTP_REQUIRE_TLS=false chỉ khi chạy test với SMTP server cục bộ không có TLS.
      requireTLS: !secure && this.requireTls,
      auth: { user, pass },
      // Không tự động hạ cấp TLS — Gmail nâng cấp liên tục nên cần linh hoạt,
      // nhưng timeout vẫn phải đặt để request đăng ký không treo vô hạn.
      tls: { rejectUnauthorized: false },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
}
