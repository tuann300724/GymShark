import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PackagesRepository, PackageRow } from './packages.repository';
import { randomUUID } from 'crypto';

@Injectable()
export class TypeOrmPackagesRepository implements PackagesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query?: { status?: string | null; search?: string | null; limit?: number }): Promise<PackageRow[]> {
    const rows = await this.dataSource.query(
      'EXEC sp_packages_list @status=@0, @search=@1, @limit=@2',
      [query?.status ?? null, query?.search ?? null, query?.limit ?? 100],
    );
    return (rows as PackageRow[]).map((r: any) => ({
      ...r,
      features: r.features ? (typeof r.features === 'string' ? JSON.parse(r.features) : r.features) : null,
      price: String(Number(r.price) || r.price),
      allowedBranches: r.allowedBranches ? (typeof r.allowedBranches === 'string' ? JSON.parse(r.allowedBranches) : r.allowedBranches) : null,
      membershipsCount: r.membershipsCount ?? 0,
    })) ?? [];
  }

  async findOne(id: string): Promise<PackageRow | null> {
    const rows = await this.dataSource.query('EXEC sp_packages_find_one @id=@0', [id]);
    const r = this.first<any>(rows);
    return r ? {
      ...r,
      features: r.features ? (typeof r.features === 'string' ? JSON.parse(r.features) : r.features) : null,
      price: String(Number(r.price) || r.price),
      allowedBranches: r.allowedBranches ? (typeof r.allowedBranches === 'string' ? JSON.parse(r.allowedBranches) : r.allowedBranches) : null,
      membershipsCount: r.membershipsCount ?? 0,
    } : null;
  }

  async findByCode(code: string): Promise<PackageRow | null> {
    const rows = await this.dataSource.query('EXEC sp_packages_find_by_code @code=@0', [code]);
    const r = this.first<any>(rows);
    return r ? {
      ...r,
      features: r.features ? (typeof r.features === 'string' ? JSON.parse(r.features) : r.features) : null,
      price: String(Number(r.price) || r.price),
      allowedBranches: r.allowedBranches ? (typeof r.allowedBranches === 'string' ? JSON.parse(r.allowedBranches) : r.allowedBranches) : null,
      membershipsCount: r.membershipsCount ?? 0,
    } : null;
  }

  async countMemberships(id: string): Promise<number> {
    const rows = await this.dataSource.query('SELECT COUNT(*) AS total FROM dbo.memberships WHERE packageId = @0', [id]);
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async create(input: any): Promise<PackageRow> {
    const id = input.id ?? randomUUID();
    const code = input.code;
    const rows = await this.dataSource.query(
      'EXEC sp_packages_create @id=@0, @code=@1, @name=@2, @description=@3, @features=@4, @durationDays=@5, @price=@6, @sessions=@7, @type=@8, @status=@9, @allowedBranches=@10',
      [
        id,
        code,
        input.name,
        input.description ?? null,
        input.features ? JSON.stringify(input.features) : null,
        input.durationDays,
        input.price,
        input.sessions ?? null,
        input.type ?? 'FIXED_TERM',
        input.status ?? 'ACTIVE',
        input.allowedBranches ? JSON.stringify(input.allowedBranches) : null,
      ],
    );
    return this.first<PackageRow>(rows) as PackageRow;
  }

  async update(id: string, input: any): Promise<PackageRow | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_packages_update @id=@0, @code=@1, @name=@2, @description=@3, @features=@4, @durationDays=@5, @price=@6, @sessions=@7, @type=@8, @status=@9, @allowedBranches=@10',
      [
        id,
        input.code ?? null,
        input.name ?? null,
        input.description === undefined ? null : input.description,
        input.features === undefined ? null : (typeof input.features === 'object' ? JSON.stringify(input.features) : input.features),
        input.durationDays ?? null,
        input.price ?? null,
        input.sessions === undefined ? null : input.sessions,
        input.type ?? null,
        input.status ?? null,
        input.allowedBranches === undefined ? null : (Array.isArray(input.allowedBranches) ? JSON.stringify(input.allowedBranches) : input.allowedBranches),
      ],
    );
    return this.first<PackageRow>(rows);
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.query('EXEC sp_packages_delete @id=@0', [id]);
  }
}
