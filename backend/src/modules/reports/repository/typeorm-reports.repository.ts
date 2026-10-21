import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ReportsRepository } from "./reports.repository";

@Injectable()
export class TypeOrmReportsRepository implements ReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async revenue(query?: { from?: Date; to?: Date; branchId?: string }): Promise<{ totalRevenue: number }> {
    const rows = await this.dataSource.query(
      "EXEC sp_reports_revenue @from=@0, @to=@1, @branchId=@2",
      [query?.from ?? null, query?.to ?? null, query?.branchId ?? null],
    );
    return { totalRevenue: Number(this.first<{ totalRevenue: number }>(rows)?.totalRevenue ?? 0) };
  }

  async attendance(query?: { from?: Date; to?: Date; branchId?: string }): Promise<any[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_reports_attendance @from=@0, @to=@1, @branchId=@2",
      [query?.from ?? null, query?.to ?? null, query?.branchId ?? null],
    );
    return (rows as any[]) ?? [];
  }

  async members(query?: { branchId?: string }): Promise<any[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_reports_members @branchId=@0",
      [query?.branchId ?? null],
    );
    return (rows as any[]) ?? [];
  }
}
