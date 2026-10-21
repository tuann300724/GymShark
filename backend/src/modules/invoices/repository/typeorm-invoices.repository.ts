import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { InvoiceListRow, InvoicesRepository } from "./invoices.repository";

@Injectable()
export class TypeOrmInvoicesRepository implements InvoicesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(query: {
    page: number;
    limit: number;
    status?: string;
    from?: string;
    to?: string;
    search?: string;
  }): Promise<{ data: InvoiceListRow[]; total: number }> {
    const [dataRows, countRows] = await Promise.all([
      this.dataSource.query(
        `EXEC sp_invoices_list @page=@0, @limit=@1, @status=@2, @from=@3, @to=@4, @search=@5`,
        [
          query.page,
          query.limit,
          query.status ?? null,
          query.from ?? null,
          query.to ?? null,
          query.search ?? null,
        ],
      ),
      this.dataSource.query(
        `EXEC sp_invoices_list_count @status=@0, @from=@1, @to=@2, @search=@3`,
        [
          query.status ?? null,
          query.from ?? null,
          query.to ?? null,
          query.search ?? null,
        ],
      ),
    ]);
    return {
      data: (dataRows as InvoiceListRow[]) ?? [],
      total: Number(this.first<{ total: number }>(countRows)?.total ?? 0),
    };
  }

  async findOne(id: string): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_invoices_find_one @id=@0",
      [id],
    );
    return this.first<Record<string, unknown>>(rows);
  }

  async listByMember(
    userId: string,
    query: { page: number; limit: number; status?: string },
  ): Promise<{
    data: InvoiceListRow[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [dataRows, countRows] = await Promise.all([
      this.dataSource.query(
        "EXEC sp_invoices_list_by_member @userId=@0, @page=@1, @limit=@2, @status=@3",
        [userId, query.page, query.limit, query.status ?? null],
      ),
      this.dataSource.query(
        "EXEC sp_invoices_list_by_member_count @userId=@0, @status=@1",
        [userId, query.status ?? null],
      ),
    ]);
    return {
      data: (dataRows as InvoiceListRow[]) ?? [],
      total: Number(this.first<{ total: number }>(countRows)?.total ?? 0),
      page: query.page,
      limit: query.limit,
    };
  }

  async findOneByMember(
    userId: string,
    id: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_invoices_find_one_by_member @userId=@0, @id=@1",
      [userId, id],
    );
    return this.first<Record<string, unknown>>(rows);
  }

  async findByPaymentId(
    paymentId: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_invoices_find_by_payment @paymentId=@0",
      [paymentId],
    );
    return this.first<Record<string, unknown>>(rows);
  }
}
