import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  MembershipDetailRow,
  MembershipListRow,
  MembershipRow,
  MembershipsRepository,
  PaymentRow,
} from "./memberships.repository";

/** Adapter hạ tầng cho MembershipsRepository — mọi thao tác qua Stored Procedure. */
@Injectable()
export class TypeOrmMembershipsRepository implements MembershipsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async list(): Promise<MembershipListRow[]> {
    const rows = await this.dataSource.query("EXEC sp_memberships_list");
    return (rows as MembershipListRow[]) ?? [];
  }

  async findOne(id: string): Promise<MembershipDetailRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_find_one @id=@0",
      [id],
    );
    return this.first<MembershipDetailRow>(rows);
  }

  async findById(id: string): Promise<MembershipRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_find_by_id @id=@0",
      [id],
    );
    return this.first<MembershipRow>(rows);
  }

  async paymentsByMembership(membershipId: string): Promise<PaymentRow[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_payments @membershipId=@0",
      [membershipId],
    );
    return (rows as PaymentRow[]) ?? [];
  }

  async hasPaidPayment(membershipId: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_has_paid_payment @membershipId=@0",
      [membershipId],
    );
    return !!this.first<{ id: string }>(rows);
  }

  async setStatus(
    id: string,
    status: string,
    notification?: { title: string; content: string } | null,
  ): Promise<MembershipRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_set_status @id=@0, @status=@1, @notificationTitle=@2, @notificationContent=@3",
      [id, status, notification?.title ?? null, notification?.content ?? null],
    );
    return this.first<MembershipRow>(rows);
  }

  async extend(input: {
    id: string;
    days: number;
    paymentCode: string;
    reason?: string | null;
    notificationContent: string;
  }): Promise<MembershipRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_memberships_extend @id=@0, @days=@1, @paymentCode=@2, @reason=@3, @notificationContent=@4",
      [
        input.id,
        input.days,
        input.paymentCode,
        input.reason ?? null,
        input.notificationContent,
      ],
    );
    return this.first<MembershipRow>(rows);
  }

  async paymentCount(): Promise<number> {
    const rows = await this.dataSource.query(
      "EXEC sp_payments_next_code @year=@0",
      [new Date().getFullYear()],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }
}
