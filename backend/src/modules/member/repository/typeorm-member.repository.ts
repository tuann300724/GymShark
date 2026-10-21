import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { MemberProfileRow, MemberRepository } from "./member.repository";

@Injectable()
export class TypeOrmMemberRepository implements MemberRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async findByUserId(userId: string): Promise<MemberProfileRow | null> {
    // Hai bước: userId -> memberId qua auth SP, rồi lấy full profile qua members SP.
    const authRows = await this.dataSource.query(
      "EXEC sp_auth_find_member_by_user_id @userId=@0",
      [userId],
    );
    const auth = this.first<{ id: string }>(authRows);
    if (!auth) return null;
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_id @id=@0",
      [auth.id],
    );
    return this.first<MemberProfileRow>(rows);
  }

  async findById(id: string): Promise<MemberProfileRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_id @id=@0",
      [id],
    );
    return this.first<MemberProfileRow>(rows);
  }

  async findByCode(code: string): Promise<MemberProfileRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_code @code=@0",
      [code],
    );
    return this.first<MemberProfileRow>(rows);
  }

  async stats() {
    const rows = await this.dataSource.query("EXEC sp_members_stats");
    return (
      this.first<{
        total: number;
        active: number;
        pending: number;
        expired: number;
        inactive: number;
      }>(rows) ?? { total: 0, active: 0, pending: 0, expired: 0, inactive: 0 }
    );
  }
}
