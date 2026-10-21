import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationRepository, NotificationRow } from './notifications.repository';

/**
 * TypeOrmNotificationsRepository — adapter hạ tầng cho NotificationsRepository.
 *
 * Mọi thao tác đi qua Stored Procedure (EXEC sp_notifications_*) hoặc query có tham số
 * hoá để tránh SQL injection. Cột `data` lưu JSON (nvarchar(max)) nên được parse lại
 * khi đọc để giữ đúng contract với Prisma (Json).
 */
@Injectable()
export class TypeOrmNotificationsRepository implements NotificationRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  /** Chuẩn hoá row: `data` là JSON string trong SQL Server → parse về object. */
  private mapRow(row: any): NotificationRow {
    if (!row) return row;
    if (typeof row.data === 'string' && row.data.length) {
      try {
        row.data = JSON.parse(row.data);
      } catch {
        row.data = null;
      }
    }
    if (typeof row.isRead === 'number') row.isRead = row.isRead === 1;
    return row as NotificationRow;
  }

  private mapRows(rows: unknown): NotificationRow[] {
    return ((rows as any[]) ?? []).map((r) => this.mapRow(r));
  }

  // ===================== TẠO =====================

  async create(input: any): Promise<string> {
    const rows = await this.dataSource.query(
      `EXEC sp_notifications_create @userId=@0, @memberId=@1, @title=@2, @content=@3, @type=@4,
         @link=@5, @referenceType=@6, @referenceId=@7, @data=@8, @isRead=@9`,
      [
        input.userId ?? null,
        input.memberId ?? null,
        input.title,
        input.content,
        input.type ?? 'SYSTEM',
        input.link ?? null,
        input.referenceType ?? null,
        input.referenceId ?? null,
        input.data ? JSON.stringify(input.data) : null,
        input.isRead ?? false,
      ],
    );
    return this.first<{ id: string }>(rows)?.id ?? null;
  }

  async createMany(inputs: any[]): Promise<number> {
    if (!inputs?.length) return 0;
    const rows = await this.dataSource.query(
      `EXEC sp_notifications_create @userId=@0, @memberId=@1, @title=@2, @content=@3, @type=@4,
         @link=@5, @referenceType=@6, @referenceId=@7, @data=@8, @isRead=@9`,
      inputs.map((i) => [
        i.userId ?? null,
        i.memberId ?? null,
        i.title,
        i.content,
        i.type ?? 'SYSTEM',
        i.link ?? null,
        i.referenceType ?? null,
        i.referenceId ?? null,
        i.data ? JSON.stringify(i.data) : null,
        i.isRead ?? false,
      ]),
    );
    return (rows as unknown[]).length;
  }

  // ===================== ĐỌC =====================

  async findFirst(where: any): Promise<NotificationRow | null> {
    const { sql, params } = this.buildWhere(where);
    const rows = await this.dataSource.query(
      `SELECT TOP 1 * FROM dbo.notifications${sql} ORDER BY createdAt DESC`,
      params,
    );
    const row = (rows as any[])?.[0];
    return row ? this.mapRow(row) : null;
  }

  async findMany(where: any, opts?: { take?: number }): Promise<NotificationRow[]> {
    const { sql, params } = this.buildWhere(where);
    const take = opts?.take && opts.take > 0 ? opts.take : null;
    const rows = await this.dataSource.query(
      `SELECT * FROM dbo.notifications${sql} ORDER BY createdAt DESC` +
        (take ? ` OFFSET 0 ROWS FETCH NEXT ${take} ROWS ONLY` : ''),
      params,
    );
    return this.mapRows(rows);
  }

  async count(where: any): Promise<number> {
    const { sql, params } = this.buildWhere(where);
    const rows = await this.dataSource.query(`SELECT COUNT(*) AS total FROM dbo.notifications${sql}`, params);
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async findOne(id: string): Promise<NotificationRow | null> {
    const rows = await this.dataSource.query('SELECT * FROM dbo.notifications WHERE id = @0', [id]);
    return rows?.length ? this.mapRow((rows as any[])[0]) : null;
  }

  // ===================== GHI =====================

  async update(id: string, data: any): Promise<void> {
    await this.dataSource.query('EXEC sp_notifications_update @id=@0, @isRead=@1, @readAt=@2', [
      id,
      data.isRead ?? null,
      data.readAt ?? null,
    ]);
  }

  async updateMany(where: any, data: any): Promise<number> {
    const { sql, params } = this.buildWhere(where);
    const rows = await this.dataSource.query(
      `UPDATE dbo.notifications SET isRead = @${params.length}, readAt = @${params.length + 1}${sql} RETURNING id`,
      [...params, data.isRead ?? null, data.readAt ?? null],
    );
    return (rows as unknown[]).length;
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.query('EXEC sp_notifications_delete @id=@0', [id]);
  }

  async adminList(query?: any) {
    const where: any = {};
    if (query?.type) where.type = query.type;
    if (query?.unread === 'true') where.isRead = false;
    if (query?.from || query?.to) {
      where.createdAt = {
        ...(query?.from ? { gte: new Date(query.from) } : {}),
        ...(query?.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query?.role) where.userRole = query.role;
    if (query?.search) where.OR = [{ contains: query.search.trim() }];

    const [data, total, unreadCount] = await Promise.all([
      this.findMany(where, { take: Math.min(200, Math.max(1, query?.limit || 100)) }),
      this.count(where),
      this.count({ ...where, isRead: false }),
    ]);
    return { data, total, unreadCount };
  }

  // ===================== BỘ LỌC =====================

  /** Dựng mệnh đề WHERE + tham số từ object `where` kiểu Prisma (đơn giản hoá). */
  private buildWhere(where: any): { sql: string; params: any[] } {
    const params: any[] = [];
    const parts: string[] = [];

    const add = (condition: string, value: any) => {
      parts.push(condition);
      params.push(value);
    };

    if (where?.userId !== undefined && where?.userId !== null) add('userId = @?', where.userId);
    if (where?.memberId !== undefined && where?.memberId !== null) add('memberId = @?', where.memberId);
    if (where?.isRead !== undefined && where?.isRead !== null) add('isRead = @?', where.isRead);
    if (where?.type) add('type = @?', where.type);
    if (where?.referenceType !== undefined) add('referenceType = @?', where.referenceType);
    if (where?.referenceId !== undefined) add('referenceId = @?', where.referenceId);
    if (where?.createdAt?.gte) add('createdAt >= @?', where.createdAt.gte);
    if (where?.createdAt?.lte) add('createdAt <= @?', where.createdAt.lte);
    if (where?.userRole) {
      add(
        'EXISTS (SELECT 1 FROM dbo.users u WHERE u.id = dbo.notifications.userId AND u.role = @?)',
        where.userRole,
      );
    }
    if (where?.OR?.length) {
      const ors: string[] = [];
      for (const cond of where.OR) {
        if (cond?.contains) {
          ors.push('(title LIKE @? OR content LIKE @?)');
          params.push(`%${cond.contains}%`);
          params.push(`%${cond.contains}%`);
        }
      }
      if (ors.length) parts.push(`(${ors.join(' OR ')})`);
    }

    // Thay placeholder @? bằng @0, @1... theo thứ tự params
    let idx = 0;
    const sql = parts.length
      ? ' WHERE ' +
        parts
          .join(' AND ')
          .replace(/@\?/g, () => `@${idx++}`)
      : '';

    // Với mệnh đề OR có 2 tham số cho 1 điều kiện — sửa lại chỉ số cho khớp
    // (đơn giản: dựng lại từ đầu với index tăng dần cho từng placeholder)
    let counter = 0;
    const rebuilt: string[] = [];
    for (const p of parts) rebuilt.push(p);
    const finalSql = parts.length
      ? ' WHERE ' +
        rebuilt
          .join(' AND ')
          .replace(/@\?/g, () => `@${counter++}`)
      : '';
    void sql;
    return { sql: finalSql, params };
  }
}
