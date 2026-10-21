import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  BranchRelatedCounts,
  BranchRow,
  BranchStats,
  BranchesRepository,
  RoomRow,
} from "./branches.repository";

/** Adapter hạ tầng cho BranchesRepository — mọi thao tác qua Stored Procedure. */
@Injectable()
export class TypeOrmBranchesRepository implements BranchesRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  // ===================== Branch đọc =====================

  async findAll(
    role: string,
    userBranchId?: string | null,
  ): Promise<BranchRow[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_list @role=@0, @userBranchId=@1",
      [role, userBranchId ?? null],
    );
    return (rows as BranchRow[]) ?? [];
  }

  async findOne(id: string): Promise<BranchRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_find_one @id=@0",
      [id],
    );
    return this.first<BranchRow>(rows);
  }

  async findById(id: string): Promise<BranchRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_find_by_id @id=@0",
      [id],
    );
    return this.first<BranchRow>(rows);
  }

  async findByCode(
    code: string,
    excludeId?: string | null,
  ): Promise<{ id: string; code: string } | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_find_by_code @code=@0, @excludeId=@1",
      [code, excludeId ?? null],
    );
    return this.first<{ id: string; code: string }>(rows);
  }

  async stats(id: string): Promise<BranchStats> {
    const rows = await this.dataSource.query("EXEC sp_branches_stats @id=@0", [
      id,
    ]);
    return (
      this.first<BranchStats>(rows) ?? {
        totalMembers: 0,
        activeMembers: 0,
        totalTrainers: 0,
        equipmentCount: 0,
        roomAvailable: 0,
        roomCount: 0,
        checkInsToday: 0,
        revenueThisMonth: 0,
        upcomingSessions: 0,
      }
    );
  }

  async equipmentByStatus(
    id: string,
  ): Promise<{ status: string; cnt: number }[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_equipment_status @id=@0",
      [id],
    );
    return (rows as { status: string; cnt: number }[]) ?? [];
  }

  async equipment(id: string, top = 100): Promise<Record<string, unknown>[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_equipment @branchId=@0, @top=@1",
      [id, top],
    );
    return (rows as Record<string, unknown>[]) ?? [];
  }

  async relatedCounts(id: string): Promise<BranchRelatedCounts> {
    const rows = await this.dataSource.query(
      "EXEC sp_branches_related_counts @id=@0",
      [id],
    );
    return (
      this.first<BranchRelatedCounts>(rows) ?? {
        memberCount: 0,
        checkInCount: 0,
        equipmentCount: 0,
        roomCount: 0,
        scheduleCount: 0,
        userCount: 0,
      }
    );
  }

  async upcomingSchedules(
    branchId?: string | null,
    roomId?: string | null,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      "EXEC sp_schedules_upcoming_count @branchId=@0, @roomId=@1",
      [branchId ?? null, roomId ?? null],
    );
    return Number(this.first<{ upcoming: number }>(rows)?.upcoming ?? 0);
  }

  // ===================== Branch ghi =====================

  async create(
    input: Partial<BranchRow> & {
      code: string;
      name: string;
      address: string;
      phone: string;
    },
  ): Promise<{ id: string }> {
    const rows = await this.dataSource.query(
      `EXEC sp_branches_create @code=@0, @name=@1, @address=@2, @phone=@3, @email=@4, @description=@5,
         @openingTime=@6, @closingTime=@7, @openingHours=@8, @status=@9`,
      [
        input.code,
        input.name,
        input.address,
        input.phone,
        input.email ?? null,
        input.description ?? null,
        input.openingTime ?? null,
        input.closingTime ?? null,
        input.openingHours ?? null,
        input.status ?? "ACTIVE",
      ],
    );
    return (this.first<{ id: string }>(rows) ?? { id: "" }) as { id: string };
  }

  async update(id: string, input: Partial<BranchRow>): Promise<void> {
    await this.dataSource.query(
      `EXEC sp_branches_update @id=@0, @code=@1, @name=@2, @address=@3, @phone=@4, @email=@5,
         @description=@6, @openingTime=@7, @closingTime=@8, @openingHours=@9, @status=@10`,
      [
        id,
        input.code ?? null,
        input.name ?? null,
        input.address ?? null,
        input.phone ?? null,
        input.email ?? null,
        input.description ?? null,
        input.openingTime ?? null,
        input.closingTime ?? null,
        input.openingHours ?? null,
        input.status ?? null,
      ],
    );
  }

  async setStatus(id: string, status: string): Promise<void> {
    await this.dataSource.query(
      "EXEC sp_branches_set_status @id=@0, @status=@1",
      [id, status],
    );
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.query("EXEC sp_branches_delete @id=@0", [id]);
  }

  // ===================== Rooms =====================

  async roomsByBranch(branchId: string): Promise<RoomRow[]> {
    const rows = await this.dataSource.query(
      "EXEC sp_rooms_list_by_branch @branchId=@0",
      [branchId],
    );
    return (rows as RoomRow[]) ?? [];
  }

  async roomFindOne(
    id: string,
    branchId?: string | null,
  ): Promise<RoomRow | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_rooms_find_one @id=@0, @branchId=@1",
      [id, branchId ?? null],
    );
    return this.first<RoomRow>(rows);
  }

  async roomFindByCode(
    branchId: string,
    code: string,
    excludeId?: string | null,
  ): Promise<{ id: string; code: string } | null> {
    const rows = await this.dataSource.query(
      "EXEC sp_rooms_find_by_code @branchId=@0, @code=@1, @excludeId=@2",
      [branchId, code, excludeId ?? null],
    );
    return this.first<{ id: string; code: string }>(rows);
  }

  async roomCreate(
    input: Partial<RoomRow> & { branchId: string; name: string },
  ): Promise<{ id: string }> {
    const rows = await this.dataSource.query(
      `EXEC sp_rooms_create @branchId=@0, @code=@1, @name=@2, @type=@3, @capacity=@4,
         @floor=@5, @description=@6, @status=@7`,
      [
        input.branchId,
        input.code ?? null,
        input.name,
        input.type ?? "GYM_AREA",
        input.capacity ?? 20,
        input.floor ?? null,
        input.description ?? null,
        input.status ?? "AVAILABLE",
      ],
    );
    return (this.first<{ id: string }>(rows) ?? { id: "" }) as { id: string };
  }

  async roomUpdate(id: string, input: Partial<RoomRow>): Promise<void> {
    await this.dataSource.query(
      `EXEC sp_rooms_update @id=@0, @code=@1, @name=@2, @type=@3, @capacity=@4, @floor=@5,
         @description=@6, @status=@7`,
      [
        id,
        input.code ?? null,
        input.name ?? null,
        input.type ?? null,
        input.capacity ?? null,
        input.floor ?? null,
        input.description ?? null,
        input.status ?? null,
      ],
    );
  }

  async roomSetStatus(id: string, status: string): Promise<void> {
    await this.dataSource.query("EXEC sp_rooms_set_status @id=@0, @status=@1", [
      id,
      status,
    ]);
  }

  async roomDelete(id: string): Promise<void> {
    await this.dataSource.query("EXEC sp_rooms_delete @id=@0", [id]);
  }

  async roomRelatedCounts(
    id: string,
  ): Promise<{ equipmentCount: number; scheduleCount: number }> {
    const rows = await this.dataSource.query(
      "EXEC sp_rooms_related_counts @id=@0",
      [id],
    );
    return (
      this.first<{ equipmentCount: number; scheduleCount: number }>(rows) ?? {
        equipmentCount: 0,
        scheduleCount: 0,
      }
    );
  }
}
