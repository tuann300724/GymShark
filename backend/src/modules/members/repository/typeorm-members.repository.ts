import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  CreateMemberInput,
  MemberListQuery,
  MemberListRow,
  MembershipRow,
  MembersRepository,
  UpdateMemberInput,
} from "./members.repository";

/**
 * TypeOrmMembersRepository — adapter hạ tầng cho MembersRepository.
 *
 * Mọi thao tác data đi qua Stored Procedure (EXEC sp_*). SP đã có TRY/CATCH;
 * SP transaction tự BEGIN TRAN/ROLLBACK. Driver mssql chỉ trả result set ĐẦU TIÊN
 * nên các SP nhiều kết quả đã được tách thành nhiều SP đơn (mỗi SP 1 result set).
 */
@Injectable()
export class TypeOrmMembersRepository implements MembersRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  // ===================== ĐỌC =====================

  async count(
    query: Omit<MemberListQuery, "page" | "limit" | "sortField" | "sortDir">,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `EXEC sp_members_list_count @search=@0, @status=@1, @branchId=@2, @membershipStatus=@3, @packageId=@4`,
      [
        query.search ?? null,
        query.status ?? null,
        query.branchId ?? null,
        query.membershipStatus ?? null,
        query.packageId ?? null,
      ],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async list(query: MemberListQuery): Promise<MemberListRow[]> {
    const rows = await this.dataSource.query(
      `EXEC sp_members_list @page=@0, @limit=@1, @search=@2, @status=@3, @branchId=@4,
         @membershipStatus=@5, @packageId=@6, @sortField=@7, @sortDir=@8`,
      [
        query.page,
        query.limit,
        query.search ?? null,
        query.status ?? null,
        query.branchId ?? null,
        query.membershipStatus ?? null,
        query.packageId ?? null,
        query.sortField ?? "createdAt",
        query.sortDir ?? "desc",
      ],
    );
    return (rows as MemberListRow[]) ?? [];
  }

  async findOne(id: string): Promise<MemberListRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_one @id=@0",
      [id],
    );
    return this.first<MemberListRow>(rows);
  }

  async findById(id: string): Promise<MemberListRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_id @id=@0",
      [id],
    );
    return this.first<MemberListRow>(rows);
  }

  async findByCode(code: string): Promise<MemberListRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_code @code=@0",
      [code],
    );
    return this.first<MemberListRow>(rows);
  }

  async findByUserId(userId: string): Promise<MemberListRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_find_by_user_id @userId=@0",
      [userId],
    );
    return this.first<MemberListRow>(rows);
  }

  async findByEmail(
    email: string,
  ): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  } | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_auth_find_user_by_email @email=@0",
      [email],
    );
    return this.first<{
      id: string;
      email: string;
      fullName: string;
      role: string;
      status: string;
    }>(rows);
  }

  async findUserByPhone(
    phone: string,
  ): Promise<{ id: string; fullName: string } | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_auth_find_user_by_phone @phone=@0",
      [phone],
    );
    return this.first<{ id: string; fullName: string }>(rows);
  }

  async countAll(): Promise<number> {
    const rows = await this.dataSource.query("EXEC sp_members_count");
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
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
      }>(rows) ?? {
        total: 0,
        active: 0,
        pending: 0,
        expired: 0,
        inactive: 0,
      }
    );
  }

  async memberships(memberId: string, top = 100): Promise<MembershipRow[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_memberships @memberId=@0, @top=@1",
      [memberId, top],
    );
    return (rows as MembershipRow[]) ?? [];
  }

  async payments(
    memberId: string,
    top = 50,
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_payments @memberId=@0, @top=@1",
      [memberId, top],
    );
    return (rows as Record<string, unknown>[]) ?? [];
  }

  async checkIns(
    memberId: string,
    top = 30,
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_checkins @memberId=@0, @top=@1",
      [memberId, top],
    );
    return (rows as Record<string, unknown>[]) ?? [];
  }

  async schedules(
    memberId: string,
    top = 20,
  ): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_schedules @memberId=@0, @top=@1",
      [memberId, top],
    );
    return (rows as Record<string, unknown>[]) ?? [];
  }

  async attendanceStats(memberId: string) {
    const rows = await this.dataSource.query(
      "EXEC sp_members_attendance_stats @memberId=@0",
      [memberId],
    );
    return (
      this.first<{
        totalVisits: number;
        lastVisit: Date | null;
        doneCount: number;
        totalMinutes: number | null;
      }>(rows) ?? {
        totalVisits: 0,
        lastVisit: null,
        doneCount: 0,
        totalMinutes: null,
      }
    );
  }

  async getTrainers(memberId: string): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_members_get_trainers @memberId=@0",
      [memberId],
    );
    return (rows as Record<string, unknown>[]) ?? [];
  }

  // ===================== GHI =====================

  async create(input: CreateMemberInput): Promise<MemberListRow> {
    const rows = await this.dataSource.query(
      `EXEC sp_members_create @userId=@0, @code=@1, @fullName=@2, @email=@3, @phone=@4, @gender=@5,
         @dateOfBirth=@6, @address=@7, @avatarUrl=@8, @status=@9, @notes=@10, @emergencyContact=@11,
         @joinedAt=@12, @branchId=@13`,
      [
        input.userId ?? null,
        input.code,
        input.fullName,
        input.email ?? null,
        input.phone,
        input.gender ?? "MALE",
        input.dateOfBirth ?? null,
        input.address ?? null,
        null,
        "ACTIVE",
        null,
        input.emergencyContact ?? null,
        null,
        input.branchId,
      ],
    );
    return this.first<MemberListRow>(rows) as MemberListRow;
  }

  async createWithUser(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    branchId: string;
    code: string;
    gender?: string;
    dateOfBirth?: Date | null;
    address?: string | null;
    emergencyContact?: string | null;
  }): Promise<{ userId: string; memberId: string }> {
    const rows = await this.dataSource.query(
      `EXEC sp_members_create_with_user @email=@0, @passwordHash=@1, @fullName=@2, @phone=@3, @branchId=@4,
         @code=@5, @gender=@6, @dateOfBirth=@7, @address=@8, @emergencyContact=@9`,
      [
        input.email,
        input.passwordHash,
        input.fullName,
        input.phone,
        input.branchId,
        input.code,
        input.gender ?? "MALE",
        input.dateOfBirth ?? null,
        input.address ?? null,
        input.emergencyContact ?? null,
      ],
    );
    const r = this.first<{ userId: string; memberId: string }>(rows);
    return { userId: r?.userId as string, memberId: r?.memberId as string };
  }

  async update(
    id: string,
    input: UpdateMemberInput,
  ): Promise<MemberListRow | null> {
    const rows = await this.dataSource.query(
      `EXEC sp_members_update @id=@0, @fullName=@1, @email=@2, @phone=@3, @gender=@4, @dateOfBirth=@5,
         @address=@6, @avatarUrl=@7, @status=@8, @notes=@9, @emergencyContact=@10, @joinedAt=@11, @setEmail=@12`,
      [
        id,
        input.fullName ?? null,
        input.email ?? null,
        input.phone ?? null,
        input.gender ?? null,
        input.dateOfBirth ?? null,
        input.address ?? null,
        null,
        input.status ?? null,
        input.notes ?? null,
        input.emergencyContact ?? null,
        null,
        input.email !== undefined ? 1 : 0,
      ],
    );
    return this.first<MemberListRow>(rows);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.dataSource.query(
      "EXEC sp_members_update_status @id=@0, @status=@1",
      [id, status],
    );
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.query("EXEC sp_members_delete @id=@0", [id]);
  }

  async updateUserStatusEmail(
    id: string,
    input: { status?: string; email?: string; setEmail?: boolean },
  ): Promise<void> {
    await this.dataSource.query(
      "EXEC sp_users_update_status_email @id=@0, @status=@1, @email=@2, @setEmail=@3",
      [id, input.status ?? null, input.email ?? null, input.setEmail ? 1 : 0],
    );
  }

  async createNotification(input: {
    userId?: string | null;
    memberId?: string | null;
    title: string;
    content: string;
    type?: string;
    link?: string | null;
  }): Promise<void> {
    await this.dataSource.query(
      `EXEC sp_notifications_create @userId=@0, @memberId=@1, @title=@2, @content=@3, @type=@4, @link=@5,
         @referenceType=@6, @referenceId=@7, @data=@8`,
      [
        input.userId ?? null,
        input.memberId ?? null,
        input.title,
        input.content,
        input.type ?? "SYSTEM",
        input.link ?? null,
        null,
        null,
        null,
      ],
    );
  }

  async findBranchById(id: string) {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_find_by_id @id=@0",
      [id],
    );
    return this.first<{
      id: string;
      status: string;
      name: string;
      code: string;
    }>(rows);
  }

  async findActiveBranch(): Promise<{ id: string } | null> {
    const rows = await this.dataSource.query("EXEC sp_auth_find_active_branch");
    return this.first<{ id: string }>(rows);
  }
}
