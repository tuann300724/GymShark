import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  CheckInRow,
  CheckInCreateInput,
  CheckInListQuery,
  CheckinsRepository,
} from './checkins.repository';

@Injectable()
export class TypeOrmCheckinsRepository implements CheckinsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  private mapRow(row: any): CheckInRow {
    return {
      id: row.id,
      memberId: row.memberId,
      branchId: row.branchId,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      method: row.method,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      member: row.member_id ? {
        id: row.member_id,
        code: row.member_code,
        fullName: row.member_fullName,
        phone: row.member_phone,
        avatarUrl: row.member_avatarUrl ?? null,
      } : null,
      branch: row.branch_id ? {
        id: row.branch_id,
        name: row.branch_name,
        code: row.branch_code,
      } : null,
    } as CheckInRow;
  }

  async create(input: CheckInCreateInput): Promise<CheckInRow> {
    const rows = await this.dataSource.query(
      `EXEC sp_checkins_create @memberId=@0, @branchId=@1, @checkInTime=@2, @method=@3`,
      [input.memberId, input.branchId, input.checkInTime, input.method ?? 'MANUAL'],
    );
    const r = this.first<CheckInRow>(rows);
    if (!r) throw new Error('sp_checkins_create did not return a row');
    // SP hardcodes status 'COMPLETED'; sửa lại để khớp với hệ thống CHECKED_IN
    await this.dataSource.query(
      `UPDATE dbo.check_ins SET status = @0, notes = @1, updatedAt = GETDATE() WHERE id = @2`,
      [input.status ?? 'CHECKED_IN', input.notes ?? null, r.id],
    );
    // Enrich từ DB
    const enriched = await this.dataSource.query(
      `SELECT c.id, c.memberId, c.branchId, c.checkInTime, c.checkOutTime, c.method, c.status, c.notes, c.createdAt, c.updatedAt,
              b.id as branch_id, b.name as branch_name, b.code as branch_code,
              m.id as member_id, m.code as member_code, m.fullName as member_fullName, m.phone as member_phone, m.avatarUrl as member_avatarUrl
       FROM dbo.check_ins c
       LEFT JOIN dbo.members m ON c.memberId = m.id
       LEFT JOIN dbo.branches b ON c.branchId = b.id
       WHERE c.id = @0`,
      [r.id],
    );
    const row = this.first<any>(enriched);
    if (!row) return r as CheckInRow;
    return {
      id: row.id,
      memberId: row.memberId,
      branchId: row.branchId,
      checkInTime: row.checkInTime,
      checkOutTime: row.checkOutTime,
      method: row.method,
      status: row.status,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      member: row.member_id ? {
        id: row.member_id,
        code: row.member_code,
        fullName: row.member_fullName,
        phone: row.member_phone,
        avatarUrl: row.member_avatarUrl ?? null,
      } : null,
      branch: row.branch_id ? {
        id: row.branch_id,
        name: row.branch_name,
        code: row.branch_code,
      } : null,
    } as CheckInRow;
  }

  async list(query?: CheckInListQuery): Promise<CheckInRow[]> {
    const q = query ?? {};
    const rows = await this.dataSource.query(
      `EXEC sp_checkins_list @memberId=@0, @branchId=@1, @from=@2, @to=@3, @limit=@4`,
      [
        q.memberId ?? null,
        q.branchId ?? null,
        q.from ? new Date(q.from) : null,
        q.to ? new Date(q.to) : null,
        q.limit ?? 50,
      ],
    );
    return (rows as CheckInRow[]) ?? [];
  }

  async findOne(id: string): Promise<CheckInRow | null> {
    const rows = await this.dataSource.query(
      `SELECT c.id, c.memberId, c.branchId, c.checkInTime, c.checkOutTime, c.method, c.status, c.notes, c.createdAt, c.updatedAt,
              b.id as branch_id, b.name as branch_name, b.code as branch_code,
              m.id as member_id, m.code as member_code, m.fullName as member_fullName, m.phone as member_phone, m.avatarUrl as member_avatarUrl
       FROM dbo.check_ins c
       LEFT JOIN dbo.members m ON c.memberId = m.id
       LEFT JOIN dbo.branches b ON c.branchId = b.id
       WHERE c.id = @0`,
      [id],
    );
    const row = this.first<any>(rows);
    return row ? this.mapRow(row) : null;
  }

  async findActive(memberId: string): Promise<CheckInRow | null> {
    const rows = await this.dataSource.query(
      `SELECT c.id, c.memberId, c.branchId, c.checkInTime, c.checkOutTime, c.method, c.status, c.notes, c.createdAt, c.updatedAt,
              b.id as branch_id, b.name as branch_name, b.code as branch_code,
              m.id as member_id, m.code as member_code, m.fullName as member_fullName, m.phone as member_phone, m.avatarUrl as member_avatarUrl
       FROM dbo.check_ins c
       LEFT JOIN dbo.members m ON c.memberId = m.id
       LEFT JOIN dbo.branches b ON c.branchId = b.id
       WHERE c.memberId = @0 AND c.status = 'CHECKED_IN'
       ORDER BY c.checkInTime DESC`,
      [memberId],
    );
    const row = this.first<any>(rows);
    return row ? this.mapRow(row) : null;
  }

  async findMany(query?: CheckInListQuery): Promise<CheckInRow[]> {
    const q = query ?? {};
    let sql = `SELECT c.id, c.memberId, c.branchId, c.checkInTime, c.checkOutTime, c.method, c.status, c.notes, c.createdAt, c.updatedAt,
              b.id as branch_id, b.name as branch_name, b.code as branch_code,
              m.id as member_id, m.code as member_code, m.fullName as member_fullName, m.phone as member_phone, m.avatarUrl as member_avatarUrl FROM dbo.check_ins c LEFT JOIN dbo.members m ON c.memberId = m.id LEFT JOIN dbo.branches b ON c.branchId = b.id WHERE 1=1`;
    const params: (string | Date | null)[] = [];

    if (q.memberId) {
      sql += ` AND c.memberId = @p`;
      params.push(q.memberId);
    }
    if (q.branchId) {
      sql += ` AND c.branchId = @p`;
      params.push(q.branchId);
    }
    if (q.status) {
      sql += ` AND c.status = @p`;
      params.push(q.status);
    }
    if (q.from) {
      sql += ` AND c.checkInTime >= @p`;
      params.push(new Date(q.from));
    }
    if (q.to) {
      sql += ` AND c.checkInTime <= @p`;
      params.push(new Date(q.to));
    }
    if (q.search) {
      sql += ` AND (m.fullName LIKE @p OR m.code LIKE @p OR m.phone LIKE @p)`;
      params.push(`%${q.search}%`);
    }

    const sortField = ['checkInTime', 'checkOutTime', 'createdAt'].includes(q.sortBy ?? '') ? q.sortBy : 'checkInTime';
    const sortDir = q.sortOrder === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY c.${sortField} ${sortDir}`;

    const limit = Math.max(1, Number(q.limit) ?? 20);
    const skip = Math.max(0, Number(q.skip) ?? 0);
    sql += ` OFFSET ${skip} ROWS FETCH NEXT ${limit} ROWS ONLY`;

    const rows = await this.dataSource.query(sql, params);
    return (rows as any[] ?? []).map(r => this.mapRow(r));
  }

  async updateCheckout(
    id: string,
    data: { checkOutTime: Date; status?: string },
  ): Promise<CheckInRow> {
    const status = data.status ?? 'CHECKED_OUT';
    await this.dataSource.query(
      `UPDATE dbo.check_ins SET checkOutTime = @0, status = @1, updatedAt = GETDATE() WHERE id = @2`,
      [data.checkOutTime, status, id],
    );
    const r = await this.findOne(id);
    if (!r) throw new Error('Check-in not found after checkout update');
    return r;
  }

  async count(query?: Pick<CheckInListQuery, 'memberId' | 'branchId' | 'status' | 'from' | 'to' | 'search'>): Promise<number> {
    const q = query ?? {};
    let sql = `SELECT COUNT(*) as total FROM dbo.check_ins c LEFT JOIN dbo.members m ON c.memberId = m.id WHERE 1=1`;
    const params: (string | Date | null)[] = [];

    if (q.memberId) {
      sql += ` AND c.memberId = @p`;
      params.push(q.memberId);
    }
    if (q.branchId) {
      sql += ` AND c.branchId = @p`;
      params.push(q.branchId);
    }
    if (q.status) {
      sql += ` AND c.status = @p`;
      params.push(q.status);
    }
    if (q.from) {
      sql += ` AND c.checkInTime >= @p`;
      params.push(new Date(q.from));
    }
    if (q.to) {
      sql += ` AND c.checkInTime <= @p`;
      params.push(new Date(q.to));
    }
    if (q.search) {
      sql += ` AND (m.fullName LIKE @p OR m.code LIKE @p OR m.phone LIKE @p)`;
      params.push(`%${q.search}%`);
    }

    const rows = await this.dataSource.query(sql, params);
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }
}
