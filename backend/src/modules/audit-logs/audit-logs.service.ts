import { Inject, Injectable, Logger } from '@nestjs/common';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import {
  AuditLogRow,
  AuditLogsRepository,
} from './repository/audit-logs.repository';
import { AUDIT_LOGS_REPOSITORY } from './repository/audit-logs.tokens';

export interface AuditLogParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
}

/**
 * AuditService — ghi nhật ký hoạt động hệ thống.
 * - log() KHÔNG bao giờ throw: lỗi ghi audit không được làm hỏng nghiệp vụ chính.
 * - Không lưu password/token vào metadata.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('AuditService');

  constructor(
    @Inject(AUDIT_LOGS_REPOSITORY)
    private readonly repo: AuditLogsRepository,
  ) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.repo.create({
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? null,
        ip: params.ip ?? null,
      });
    } catch (e) {
      this.logger.warn(
        `Không thể ghi audit log [${params.action}]`,
        e instanceof Error ? e.message : String(e),
      );
    }
  }

  /** Chuyển row phẳng từ SP sang shape nested (user) khớp Prisma include. */
  private toShape(row: AuditLogRow) {
    let metadata: unknown = row.metadata;
    if (typeof row.metadata === 'string') {
      try {
        metadata = JSON.parse(row.metadata);
      } catch {
        metadata = row.metadata;
      }
    }
    return {
      id: row.id,
      userId: row.userId,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      metadata: metadata ?? null,
      ip: row.ip,
      createdAt: row.createdAt,
      user: row.user_id
        ? {
            id: row.user_id,
            email: row.user_email,
            fullName: row.user_fullName,
            role: row.user_role,
          }
        : null,
    };
  }

  async findAll(query: QueryAuditLogsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const res = await this.repo.list({
      page,
      limit,
      userId: query.userId ?? null,
      action: query.action ?? null,
      entity: query.entity ?? null,
      search: query.search ? query.search.trim() : null,
      from: query.from ? new Date(query.from) : null,
      to: query.to ? new Date(query.to) : null,
    });

    return {
      data: res.data.map((r) => this.toShape(r)),
      total: res.total,
      page: res.page,
      limit: res.limit,
      totalPages: res.totalPages,
      actions: res.actions,
    };
  }
}
