import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PromotionsRepository, PromotionRow } from './promotions.repository';

@Injectable()
export class TypeOrmPromotionsRepository implements PromotionsRepository {
  constructor(private readonly dataSource: DataSource) {}
  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query?: any) {
    const rows = await this.dataSource.query(
      'EXEC sp_promotions_list @status=@0, @discountType=@1, @search=@2, @from=@3, @to=@4, @limit=@5',
      [query?.status ?? null, query?.type ?? null, query?.search ?? null, query?.from ?? null, query?.to ?? null, query?.limit ?? 100],
    );
    return { data: (rows as PromotionRow[]) ?? [], total: (rows as unknown[]).length };
  }

  async findOne(id: string) {
    const r = await this.dataSource.query('EXEC sp_promotions_find_one @id=@0', [id]);
    return this.first<PromotionRow>(r) ?? null;
  }

  async findByCode(code: string) {
    const r = await this.dataSource.query('EXEC sp_promotions_find_by_code @code=@0', [code]);
    return this.first<PromotionRow>(r) ?? null;
  }

  async create(input: any) {
    const r = await this.dataSource.query(
      'EXEC sp_promotions_create @code=@0, @name=@1, @description=@2, @discountType=@3, @discountValue=@4, @minOrderValue=@5, @maxDiscount=@6, @startDate=@7, @endDate=@8, @usageLimit=@9, @perMemberLimit=@10, @status=@11',
      [
        input.code, input.name, input.description ?? null, input.discountType ?? 'PERCENTAGE',
        input.discountValue ?? 0, input.minOrderValue ?? null, input.maxDiscount ?? null,
        input.startDate, input.endDate ?? null, input.usageLimit ?? null, input.perMemberLimit ?? null, input.status ?? 'ACTIVE',
      ],
    );
    return this.first<PromotionRow>(r) ?? ({} as PromotionRow);
  }

  async update(id: string, data: Partial<any>) {
    await this.dataSource.query(
      'EXEC sp_promotions_update @id=@0, @code=@1, @name=@2, @description=@3, @discountType=@4, @discountValue=@5, @startDate=@6, @endDate=@7, @usageLimit=@8, @status=@9',
      [
        id, data.code ?? null, data.name ?? null, data.description ?? null,
        data.discountType ?? null, data.discountValue ?? null, data.startDate ?? null,
        data.endDate ?? null, data.usageLimit ?? null, data.status ?? null,
      ],
    );
    return this.findOne(id);
  }

  async delete(id: string) {
    await this.dataSource.query('EXEC sp_promotions_delete @id=@0', [id]);
  }

  async setStatus(id: string, status: string) {
    await this.dataSource.query('EXEC sp_promotions_set_status @id=@0, @status=@1', [id, status]);
  }

  async updateMany(where: any, data: any) {
    const sql = `UPDATE dbo.promotions SET status = @0 WHERE status = 'ACTIVE' AND endDate < GETDATE()`;
    await this.dataSource.query(sql, [data.status ?? 'EXPIRED']);
    return 1;
  }
}
