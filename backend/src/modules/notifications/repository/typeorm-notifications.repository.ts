import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Notification } from '../../../database/entities/notification.entity';
import { NotificationRepository, NotificationRow } from './notifications.repository';

@Injectable()
export class TypeOrmNotificationsRepository implements NotificationRepository {
  private repo: Repository<Notification>;
  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Notification);
  }

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  private mapRow(row: any): NotificationRow {
    if (!row) return row;
    if (typeof row.data === 'string' && row.data.length) {
      try { row.data = JSON.parse(row.data); } catch { row.data = null; }
    }
    if (typeof row.isRead === 'number') row.isRead = row.isRead === 1;
    return row as NotificationRow;
  }

  private mapRows(rows: unknown): NotificationRow[] {
    return ((rows as any[]) ?? []).map((r) => this.mapRow(r));
  }

  async create(input: any): Promise<string> {
    const entity = this.repo.create({
      userId: input.userId ?? null,
      memberId: input.memberId ?? null,
      title: input.title,
      content: input.content,
      type: input.type ?? 'SYSTEM',
      link: input.link ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      data: input.data ? JSON.stringify(input.data) : null,
      isRead: input.isRead ?? false,
    });
    const saved = await this.repo.save(entity);
    return saved.id ?? null;
  }

  async createMany(inputs: any[]): Promise<number> {
    if (!inputs?.length) return 0;
    const entities = inputs.map((i) => this.repo.create({
      userId: i.userId ?? null,
      memberId: i.memberId ?? null,
      title: i.title,
      content: i.content,
      type: i.type ?? 'SYSTEM',
      link: i.link ?? null,
      referenceType: i.referenceType ?? null,
      referenceId: i.referenceId ?? null,
      data: i.data ? JSON.stringify(i.data) : null,
      isRead: i.isRead ?? false,
    }));
    await this.repo.save(entities);
    return entities.length;
  }

  async findFirst(where: any): Promise<NotificationRow | null> {
    const opts: any = { where, order: { createdAt: 'DESC' }, take: 1 };
    const row = await this.repo.findOne(opts);
    return row ? this.mapRow(row) : null;
  }

  async findMany(where: any, opts?: { take?: number }): Promise<NotificationRow[]> {
    const rowOpts: any = { where, order: { createdAt: 'DESC' } };
    if (opts?.take && opts.take > 0) rowOpts.take = opts.take;
    const rows = await this.repo.find(rowOpts);
    return this.mapRows(rows);
  }

  async count(where: any): Promise<number> {
    return await this.repo.count({ where });
  }

  async findOne(id: string): Promise<NotificationRow | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.mapRow(row) : null;
  }

  async update(id: string, data: any): Promise<void> {
    await this.repo.update(id, {
      isRead: data.isRead ?? null,
      readAt: data.readAt ?? null,
    });
  }

  async updateMany(where: any, data: any): Promise<number> {
    const res = await this.repo.update(where, {
      isRead: data.isRead ?? null,
      readAt: data.readAt ?? null,
    });
    return res.affected ?? 0;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
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
    if (query?.search) {
      where.title = typeof query.search === 'string' ? query.search.trim() : '';
    }
    const [data, total, unreadCount] = await Promise.all([
      this.findMany(where, { take: Math.min(200, Math.max(1, query?.limit || 100)) }),
      this.count(where),
      this.count({ ...where, isRead: false }),
    ]);
    return { data, total, unreadCount };
  }
}
