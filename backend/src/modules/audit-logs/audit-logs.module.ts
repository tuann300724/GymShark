import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit-logs.service';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsRepository } from './repository/audit-logs.repository';
import { TypeOrmAuditLogsRepository } from './repository/typeorm-audit-logs.repository';
import { AUDIT_LOGS_REPOSITORY } from './repository/audit-logs.tokens';

/**
 * AuditLogsModule — @Global để AuditService dùng được ở mọi module
 * (ghi log trực tiếp từ các service nghiệp vụ mà không cần import lại).
 */
@Global()
@Module({
  providers: [
    AuditService,
    { provide: AUDIT_LOGS_REPOSITORY, useClass: TypeOrmAuditLogsRepository },
  ],
  controllers: [AuditLogsController],
  exports: [AuditService],
})
export class AuditLogsModule {}