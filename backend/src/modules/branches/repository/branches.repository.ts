/**
 * BranchesRepository — Port (Clean Architecture) cho chi nhánh + phòng tập.
 * Toàn bộ thao tác data đi qua Stored Procedure; adapter ở `typeorm-branches.repository.ts`.
 */

export interface BranchRow {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string | null;
  description: string | null;
  openingTime: string | null;
  closingTime: string | null;
  openingHours: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  equipmentCount?: number;
  roomCount?: number;
  userCount?: number;
  scheduleCount?: number;
}

export interface RoomRow {
  id: string;
  branchId: string;
  code: string | null;
  name: string;
  type: string;
  capacity: number;
  floor: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  equipmentCount?: number;
  scheduleCount?: number;
}

export interface BranchStats {
  totalMembers: number;
  activeMembers: number;
  totalTrainers: number;
  equipmentCount: number;
  roomAvailable: number;
  roomCount: number;
  checkInsToday: number;
  revenueThisMonth: number;
  upcomingSessions: number;
}

export interface BranchRelatedCounts {
  memberCount: number;
  checkInCount: number;
  equipmentCount: number;
  roomCount: number;
  scheduleCount: number;
  userCount: number;
}

export interface BranchesRepository {
  // ---- Branch đọc ----
  findAll(role: string, userBranchId?: string | null): Promise<BranchRow[]>;
  findOne(id: string): Promise<BranchRow | null>;
  findById(id: string): Promise<BranchRow | null>;
  findByCode(
    code: string,
    excludeId?: string | null,
  ): Promise<{ id: string; code: string } | null>;
  stats(id: string): Promise<BranchStats>;
  equipmentByStatus(id: string): Promise<{ status: string; cnt: number }[]>;
  equipment(id: string, top?: number): Promise<Record<string, unknown>[]>;
  relatedCounts(id: string): Promise<BranchRelatedCounts>;
  upcomingSchedules(
    branchId?: string | null,
    roomId?: string | null,
  ): Promise<number>;

  // ---- Branch ghi ----
  create(
    input: Partial<BranchRow> & {
      code: string;
      name: string;
      address: string;
      phone: string;
    },
  ): Promise<{ id: string }>;
  update(id: string, input: Partial<BranchRow>): Promise<void>;
  setStatus(id: string, status: string): Promise<void>;
  delete(id: string): Promise<void>;

  // ---- Rooms ----
  roomsByBranch(branchId: string): Promise<RoomRow[]>;
  roomFindOne(id: string, branchId?: string | null): Promise<RoomRow | null>;
  roomFindByCode(
    branchId: string,
    code: string,
    excludeId?: string | null,
  ): Promise<{ id: string; code: string } | null>;
  roomCreate(
    input: Partial<RoomRow> & { branchId: string; name: string },
  ): Promise<{ id: string }>;
  roomUpdate(id: string, input: Partial<RoomRow>): Promise<void>;
  roomSetStatus(id: string, status: string): Promise<void>;
  roomDelete(id: string): Promise<void>;
  roomRelatedCounts(
    id: string,
  ): Promise<{ equipmentCount: number; scheduleCount: number }>;
}
