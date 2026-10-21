import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  PaymentDetailRow,
  PaymentListQuery,
  PaymentListRow,
  PaymentStats,
  PaymentsRepository,
} from "./payments.repository";

@Injectable()
export class TypeOrmPaymentsRepository implements PaymentsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(
    query: PaymentListQuery,
  ): Promise<{ data: PaymentListRow[]; total: number }> {
    const [dataRows, countRows] = await Promise.all([
      this.dataSource.query(
        `EXEC sp_payments_list @page=@0, @limit=@1, @status=@2, @method=@3, @memberId=@4,
           @packageId=@5, @from=@6, @to=@7, @search=@8`,
        [
          query.page,
          query.limit,
          query.status ?? null,
          query.method ?? null,
          query.memberId ?? null,
          query.packageId ?? null,
          query.from ?? null,
          query.to ?? null,
          query.search ?? null,
        ],
      ),
      this.dataSource.query(
        `EXEC sp_payments_list_count @status=@0, @method=@1, @memberId=@2,
           @packageId=@3, @from=@4, @to=@5, @search=@6`,
        [
          query.status ?? null,
          query.method ?? null,
          query.memberId ?? null,
          query.packageId ?? null,
          query.from ?? null,
          query.to ?? null,
          query.search ?? null,
        ],
      ),
    ]);
    return {
      data: (dataRows as PaymentListRow[]) ?? [],
      total: Number(this.first<{ total: number }>(countRows)?.total ?? 0),
    };
  }

  async stats(): Promise<PaymentStats> {
    const rows = await this.dataSource.query("EXEC sp_payments_stats");
    return (
      this.first<PaymentStats>(rows) ?? {
        totalRevenue: 0,
        revenueToday: 0,
        pendingCount: 0,
        paidCount: 0,
        failedCount: 0,
        cancelledCount: 0,
        refundedCount: 0,
        refundedTotal: 0,
      }
    );
  }

  async findOne(id: string): Promise<PaymentDetailRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_payments_find_one @id=@0",
      [id],
    );
    return this.first<PaymentDetailRow>(rows);
  }

  async findByTransactionRef(
    transactionRef: string,
    excludeId?: string,
  ): Promise<{ id: string; code: string } | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_payments_find_by_transaction_ref @transactionRef=@0, @excludeId=@1",
      [transactionRef, excludeId ?? null],
    );
    return this.first<{ id: string; code: string }>(rows);
  }

  async findByIdWithMembership(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_payments_find_by_id_full @id=@0",
      [id],
    );
    return this.first<Record<string, unknown>>(rows);
  }

  async confirm(input: {
    id: string;
    actorId: string;
    transactionRef?: string | null;
    note?: string | null;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }> {
    const resultSets = await this.dataSource.query(
      "EXEC sp_payments_confirm @id=@0, @actorId=@1, @transactionRef=@2, @note=@3",
      [
        input.id,
        input.actorId,
        input.transactionRef ?? null,
        input.note ?? null,
      ],
    );
    // mssql driver returns first result set; second may be lost but we don't need it for shape
    return {
      payment: this.first<Record<string, unknown>>(resultSets) ?? {},
      membership: null,
    };
  }

  async reject(input: {
    id: string;
    actorId: string;
    reason: string;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }> {
    const resultSets = await this.dataSource.query(
      "EXEC sp_payments_reject @id=@0, @actorId=@1, @reason=@2",
      [input.id, input.actorId, input.reason ?? ""],
    );
    return {
      payment: this.first<Record<string, unknown>>(resultSets) ?? {},
      membership: null,
    };
  }

  async refund(input: {
    id: string;
    actorId: string;
    reason: string | null;
    deactivateMembership: boolean;
  }): Promise<{
    payment: Record<string, unknown>;
    membership: Record<string, unknown> | null;
  }> {
    const resultSets = await this.dataSource.query(
      "EXEC sp_payments_refund @id=@0, @actorId=@1, @reason=@2, @deactivateMembership=@3",
      [
        input.id,
        input.actorId,
        input.reason ?? null,
        input.deactivateMembership ? 1 : 0,
      ],
    );
    return {
      payment: this.first<Record<string, unknown>>(resultSets) ?? {},
      membership: null,
    };
  }
}
