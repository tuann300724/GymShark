import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailListener } from './mail.listener';
import { InvoicePdfService } from './invoice-pdf.service';

/**
 * MailModule — @Global để MailService dùng được ở mọi module
 * (đăng ký hội viên gửi mã xác minh, hóa đơn, thông báo định kỳ…)
 * mà không cần import lại.
 *
 * MailListener (@OnEvent) chạy nền: các module khác chỉ cần
 * `eventEmitter.emit(MAIL_EVENTS.X, payload)` là gửi email được —
 * không import listener, không await.
 */
@Global()
@Module({
  providers: [MailService, InvoicePdfService, MailListener],
  exports: [MailService, InvoicePdfService],
})
export class MailModule {}
