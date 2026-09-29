import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';

/**
 * AuditLogsModule — @Global để AuditService dùng được ở mọi module
 * (ghi log trực tiếp từ các service nghiệp vụ mà không cần import lại).
 */
@Global()
@Module({
  providers: [AuditService],
  controllers: [AuditLogsController],
  exports: [AuditService],
})
export class AuditLogsModule {}