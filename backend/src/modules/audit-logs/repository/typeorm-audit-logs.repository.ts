import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditLogRow, AuditLogsRepository } from './audit-logs.repository';

@Injectable()
export class TypeOrmAuditLogsRepository implements AuditLogsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query?: any) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;
    const params = [
      query?.userId ?? null,
      query?.action ?? null,
      query?.entity ?? null,
      query?.search ?? null,
      query?.from ?? null,
      query?.to ?? null,
    ];
    const rows = await this.dataSource.query(
      'EXEC sp_audit_logs_list @page=@0, @limit=@1, @userId=@2, @action=@3, @entity=@4, @search=@5, @from=@6, @to=@7',
      [page, limit, ...params],
    );
    const countRows = await this.dataSource.query(
      'EXEC sp_audit_logs_count @userId=@0, @action=@1, @entity=@2, @search=@3, @from=@4, @to=@5',
      params,
    );
    const actionRows = await this.dataSource.query(
      'EXEC sp_audit_logs_actions @userId=@0, @action=@1, @entity=@2, @search=@3, @from=@4, @to=@5',
      params,
    );
    const total = Number(this.first<{ total: number }>(countRows)?.total ?? 0);
    return {
      data: (rows as AuditLogRow[]) ?? [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      actions: ((actionRows as { action: string }[]) ?? []).map((r) => r.action),
    };
  }

  async create(params: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: any;
    ip?: string | null;
  }): Promise<void> {
    await this.dataSource.query(
      'EXEC sp_audit_logs_create @userId=@0, @action=@1, @entity=@2, @entityId=@3, @metadata=@4, @ip=@5',
      [
        params.userId ?? null,
        params.action,
        params.entity,
        params.entityId ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        params.ip ?? null,
      ],
    );
  }
}
