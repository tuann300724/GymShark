import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailModule — @Global để MailService dùng được ở mọi module
 * (đăng ký hội viên gửi mã xác minh, sau này có thể thêm quên mật khẩu,
 * thông báo định kỳ…) mà không cần import lại.
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
