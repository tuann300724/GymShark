import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  bookingConfirmedEmail,
  invoiceEmail,
  memberVerificationCodeEmail,
  membershipExpiringEmail,
  passwordResetCodeEmail,
  staffAccountInviteEmail,
  paymentConfirmedEmail,
  welcomeEmail,
  packageChangeInvoiceEmail,
} from "./email-templates";

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** File đính kèm (hiện dùng cho hóa đơn PDF). */
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

/**
 * MailService — kênh gửi email ra ngoài hệ thống.
 *
 * Cấu hình qua biến môi trường (xem .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_REQUIRE_TLS, MAIL_FROM_NAME
 *   (địa chỉ From lấy luôn từ SMTP_USER — không có biến riêng cho địa chỉ From)
 *
 * Hợp đồng quan trọng — 2 phương thức với 2 hành vi RÕ RÀNG:
 *   send()     — NÉM LỖI khi gửi thất bại. Dùng cho Nhóm A (mã OTP xác minh,
 *                mã đặt lại mật khẩu): người dùng không nhận được mã thì PHẢI báo
 *                lỗi để họ thử lại — nuốt lỗi sẽ tạo tài khoản không kiểm soát được email.
 *   sendSafe() — nuốt lỗi, chỉ ghi log (best-effort). Dùng cho Nhóm B (hóa đơn,
 *                thông báo sắp hết hạn, chào mừng, xác nhận buổi tập) chạy nền
 *                qua EventEmitter: email trễ/fail không được phá vỡ nghiệp vụ chính.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger("MailService");
  private transporter: Transporter | null = null;
  private fromAddress: string | null = null;
  private lastConfigError: string | null = null;
  private readonly requireTls: boolean;

  constructor(private readonly config: ConfigService) {
    this.requireTls = this.config.get<string>("SMTP_REQUIRE_TLS") !== "false";
  }

  onModuleInit(): void {
    this.transporter = this.buildTransporter();
    if (this.transporter) {
      const user = this.config.get<string>("SMTP_USER");
      this.logger.log(`Đã sẵn sàng gửi email qua SMTP (tài khoản: ${user})`);
    } else {
      this.logger.warn(
        "Chưa cấu hình SMTP (SMTP_HOST/SMTP_USER/SMTP_PASS) — mọi chức năng cần gửi email sẽ báo lỗi cho người dùng.",
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
      this.logger.error(
        `Gửi email thất bại (chưa cấu hình SMTP): ${this.lastConfigError}`,
      );
      throw new ServiceUnavailableException(
        "Hệ thống chưa cấu hình dịch vụ gửi email. Vui lòng liên hệ quản trị viên.",
      );
    }

    const fromName =
      this.config.get<string>("MAIL_FROM_NAME") || "GymMaster Pro";

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${this.fromAddress}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });
      this.logger.log(`Đã gửi email "${options.subject}" tới ${options.to}`);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`Không gửi được email tới ${options.to}: ${detail}`);
      throw new ServiceUnavailableException(
        "Không gửi được mã xác minh. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.",
      );
    }
  }

  /**
   * Gửi best-effort KHÔNG ném lỗi (Nhóm B — email chạy nền qua EventEmitter).
   * Trả true nếu gửi thành công; false nếu fail (đã ghi log). Dùng cho hóa đơn,
   * thông báo sắp hết hạn, chào mừng, xác nhận buổi tập — email này fail không
   * được ảnh hưởng tới API đã trả kết quả thành công cho người dùng.
   */
  async sendSafe(options: SendMailOptions): Promise<boolean> {
    try {
      await this.send(options);
      return true;
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.warn(
        `Email nền "${options.subject}" tới ${options.to} không gửi được: ${detail}`,
      );
      return false;
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

  async sendStaffAccountInvite(params: {
    email: string;
    fullName: string;
    temporaryPassword: string;
  }): Promise<void> {
    const mail = staffAccountInviteEmail(params);
    await this.send({ to: params.email, ...mail });
  }

  // =========================================================================
  // NHÓM B — hàm nghiệp vụ cho email chạy nền (gọi từ MailListener qua sendSafe)
  // =========================================================================

  /** Hóa đơn PDF — gửi kèm file .pdf đính kèm. */
  async sendInvoiceEmail(params: {
    email: string;
    fullName: string;
    invoiceNumber: string;
    packageName: string;
    amount: number;
    issuedAt: Date;
    pdf: Buffer;
  }): Promise<boolean> {
    const mail = invoiceEmail(params);
    return this.sendSafe({
      to: params.email,
      ...mail,
      attachments: [
        {
          filename: `Hoa-don-${params.invoiceNumber}.pdf`,
          content: params.pdf,
          contentType: "application/pdf",
        },
      ],
    });
  }

  /** Xác nhận thanh toán thành công (không kèm PDF — PDF gửi riêng qua sendInvoiceEmail). */
  async sendPaymentConfirmedEmail(params: {
    email: string;
    fullName: string;
    invoiceNumber: string;
    packageName: string;
    amount: number;
    paidAt: Date;
    method: string;
  }): Promise<boolean> {
    const mail = paymentConfirmedEmail(params);
    return this.sendSafe({ to: params.email, ...mail });
  }

  /** Cảnh báo gói hội viên sắp hết hạn (≤7 ngày). */
  async sendMembershipExpiringEmail(params: {
    email: string;
    fullName: string;
    packageName: string;
    expiresAt: Date;
    daysLeft: number;
  }): Promise<boolean> {
    const mail = membershipExpiringEmail(params);
    return this.sendSafe({ to: params.email, ...mail });
  }

  /** Email chào mừng sau đăng ký hội viên thành công. */
  async sendWelcomeEmail(params: {
    email: string;
    fullName: string;
    memberCode: string;
  }): Promise<boolean> {
    const mail = welcomeEmail(params);
    return this.sendSafe({ to: params.email, ...mail });
  }

  /** Xác nhận đăng ký buổi tập thành công. */
  async sendBookingConfirmedEmail(params: {
    email: string;
    fullName: string;
    title: string;
    startTime: Date;
    endTime: Date;
    roomName?: string | null;
    trainerName?: string | null;
  }): Promise<boolean> {
    const mail = bookingConfirmedEmail(params);
    return this.sendSafe({ to: params.email, ...mail });
  }

  /** Gửi hóa đơn xác nhận thanh toán nâng cấp gói hội viên. */
  async sendPackageChangeInvoiceEmail(params: {
    email: string;
    memberName: string;
    invoiceNumber: string;
    packageName: string;
    amount: number;
    creditAmount: number;
    paymentMethod: string;
    paidAt: Date;
    transactionRef?: string | null;
    upgradeDescription: string;
  }): Promise<void> {
    const { email, ...invoice } = params;
    await this.send({ to: email, ...packageChangeInvoiceEmail(invoice) });
  }

  /** Dựng transporter từ biến môi trường; trả về null + ghi log nếu thiếu cấu hình. */
  private buildTransporter(): Transporter | null {
    const host = this.config.get<string>("SMTP_HOST")?.trim();
    const user = this.config.get<string>("SMTP_USER")?.trim();
    const pass = this.config.get<string>("SMTP_PASS")?.trim();

    if (!host || !user || !pass) {
      this.lastConfigError = "thiếu SMTP_HOST hoặc SMTP_USER hoặc SMTP_PASS";
      return null;
    }

    const port = Number(this.config.get<string>("SMTP_PORT")) || 587;
    // Gmail dùng STARTTLS trên 587; cổng 465 thì bật TLS ngay từ đầu (SMTP_SECURE=true)
    const secure = this.config.get<string>("SMTP_SECURE")
      ? this.config.get<string>("SMTP_SECURE") === "true"
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
