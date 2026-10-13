import { Module } from '@nestjs/common';
import { MemberQrService } from './member-qr.service';

/**
 * Module dùng chung cho mã QR hội viên — được nạp ở MemberModule (phát mã)
 * và CheckinsModule (xác minh mã khi lễ tân quét).
 */
@Module({
  providers: [MemberQrService],
  exports: [MemberQrService],
})
export class MemberQrModule {}
