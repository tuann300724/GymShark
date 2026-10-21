import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CreateBranchDto,
  CreateRoomDto,
  SetBranchStatusDto,
  SetRoomStatusDto,
  UpdateBranchDto,
  UpdateRoomDto,
} from "./dto/branch.dto";
import {
  BranchRow,
  BranchesRepository,
  RoomRow,
} from "./repository/branches.repository";
import { BRANCHES_REPOSITORY } from "./repository/branches.tokens";

/** Vai trò quản lý chi nhánh (create/update/status) */
const MANAGE_ROLES = ["ADMIN", "MANAGER"];

@Injectable()
export class BranchesService {
  constructor(
    @Inject(BRANCHES_REPOSITORY) private readonly repo: BranchesRepository,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private assertManage(role: string) {
    if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException("Bạn không có quyền quản lý chi nhánh.");
    }
  }

  private async getBranch(id: string) {
    const branch = await this.repo.findById(id);
    if (!branch) throw new NotFoundException("Không tìm thấy chi nhánh.");
    return branch;
  }

  /** Reshape row phẳng từ SP sang shape nested (`_count`, `rooms`) khớp Prisma include. */
  private async shapeBranch(b: BranchRow, includeEquipment = false) {
    const rooms = await this.repo.roomsByBranch(b.id);
    const base = {
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address,
      phone: b.phone,
      email: b.email,
      description: b.description,
      openingTime: b.openingTime,
      closingTime: b.closingTime,
      openingHours: b.openingHours,
      status: b.status,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      _count: {
        members: Number(b.memberCount ?? 0),
        equipment: Number(b.equipmentCount ?? 0),
        rooms: Number(b.roomCount ?? 0),
        users: Number(b.userCount ?? 0),
        schedules: Number(b.scheduleCount ?? 0),
      },
      rooms: rooms.slice(0, 50).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        type: r.type,
        capacity: r.capacity,
        status: r.status,
      })),
    };

    if (!includeEquipment) return base;

    const equipment = await this.repo.equipment(b.id, 100);
    return {
      ...base,
      equipment: equipment.map((e: any) => ({
        ...e,
        room: e.room_id ? { id: e.room_id, name: e.room_name } : null,
      })),
    };
  }

  private shapeRoom(r: RoomRow) {
    return {
      id: r.id,
      branchId: r.branchId,
      code: r.code,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      floor: r.floor,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      _count: {
        equipment: Number(r.equipmentCount ?? 0),
        schedules: Number(r.scheduleCount ?? 0),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Branch: list / detail / stats
  // ---------------------------------------------------------------------------

  async findAll(role = "ADMIN", userBranchId?: string | null) {
    const rows = await this.repo.findAll(role, userBranchId);
    return Promise.all(rows.map((b) => this.shapeBranch(b)));
  }

  async findOne(id: string, role = "ADMIN", userBranchId?: string | null) {
    const branch = await this.repo.findOne(id);
    if (!branch) throw new NotFoundException("Không tìm thấy chi nhánh.");
    if (
      (role === "STAFF" || role === "TRAINER") &&
      userBranchId &&
      branch.id !== userBranchId
    ) {
      throw new ForbiddenException("Bạn không có quyền xem chi nhánh khác.");
    }
    return this.shapeBranch(branch, true);
  }

  /** GET /branches/:id/stats — số liệu tổng hợp cho dashboard chi nhánh */
  async getStats(id: string) {
    await this.getBranch(id);

    const [stats, byStatus] = await Promise.all([
      this.repo.stats(id),
      this.repo.equipmentByStatus(id),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.status] = Number(row.cnt);

    return {
      branchId: id,
      totalMembers: Number(stats.totalMembers ?? 0),
      activeMembers: Number(stats.activeMembers ?? 0),
      totalTrainers: Number(stats.totalTrainers ?? 0),
      equipmentCount: Number(stats.equipmentCount ?? 0),
      equipmentByStatus: statusMap,
      roomAvailable: Number(stats.roomAvailable ?? 0),
      roomCount: Number(stats.roomCount ?? 0),
      checkInsToday: Number(stats.checkInsToday ?? 0),
      revenueThisMonth: Number(stats.revenueThisMonth ?? 0),
      upcomingSessions: Number(stats.upcomingSessions ?? 0),
    };
  }

  // ---------------------------------------------------------------------------
  // Branch: create / update / status / delete
  // ---------------------------------------------------------------------------

  async create(dto: CreateBranchDto, role: string) {
    this.assertManage(role);

    const existing = await this.repo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Mã chi nhánh ${dto.code} đã tồn tại.`);
    }

    const { id } = await this.repo.create({
      code: dto.code,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email ?? null,
      description: dto.description ?? null,
      openingTime: dto.openingTime ?? null,
      closingTime: dto.closingTime ?? null,
      openingHours: dto.openingHours ?? null,
      status: dto.status ?? "ACTIVE",
    });

    const branch = await this.repo.findOne(id);
    return {
      message: "Tạo chi nhánh thành công.",
      branch: branch ? await this.shapeBranch(branch) : null,
    };
  }

  async update(id: string, dto: UpdateBranchDto, role: string) {
    this.assertManage(role);
    await this.getBranch(id);

    if (dto.code) {
      const dup = await this.repo.findByCode(dto.code, id);
      if (dup)
        throw new ConflictException(
          `Mã chi nhánh ${dto.code} đã được sử dụng bởi chi nhánh khác.`,
        );
    }

    await this.repo.update(id, {
      code: dto.code,
      name: dto.name,
      address: dto.address,
      phone: dto.phone,
      email: dto.email,
      description: dto.description,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      openingHours: dto.openingHours,
      status: dto.status,
    });

    const branch = await this.repo.findOne(id);
    return {
      message: "Cập nhật chi nhánh thành công.",
      branch: branch ? await this.shapeBranch(branch) : null,
    };
  }

  /** Kích hoạt / ngừng hoạt động chi nhánh — INACTIVE chặn tạo buổi tập & check-in mới */
  async setStatus(id: string, dto: SetBranchStatusDto, role: string) {
    this.assertManage(role);
    const branch = await this.getBranch(id);

    if (branch.status === dto.status) {
      return {
        message: "Chi nhánh đã ở trạng thái này.",
        branch: await this.shapeBranch(branch),
      };
    }

    if (dto.status === "INACTIVE") {
      const upcoming = await this.repo.upcomingSchedules(branch.id, null);
      if (upcoming > 0) {
        throw new BadRequestException(
          `Chi nhánh đang có ${upcoming} buổi tập chưa diễn ra (SCHEDULED). Hãy hủy/dời các buổi này trước khi ngừng hoạt động.`,
        );
      }
    }

    await this.repo.setStatus(id, dto.status);
    const updated = await this.repo.findOne(id);

    return {
      message:
        dto.status === "ACTIVE"
          ? "Chi nhánh đã được kích hoạt lại."
          : "Chi nhánh đã ngừng hoạt động. Không thể tạo buổi tập / check-in mới tại chi nhánh này.",
      branch: updated ? await this.shapeBranch(updated) : null,
    };
  }

  /** Xóa chi nhánh — chỉ khi không còn dữ liệu liên quan (an toàn dữ liệu) */
  async remove(id: string, role: string) {
    this.assertManage(role);
    await this.getBranch(id);

    const counts = await this.repo.relatedCounts(id);
    const total =
      Number(counts.memberCount) +
      Number(counts.checkInCount) +
      Number(counts.equipmentCount) +
      Number(counts.roomCount) +
      Number(counts.scheduleCount) +
      Number(counts.userCount);

    if (total > 0) {
      throw new BadRequestException(
        `Không thể xóa chi nhánh còn dữ liệu (${total} bản ghi liên quan: hội viên, check-in, thiết bị, phòng, lịch tập, tài khoản). Hãy chuyển sang trạng thái INACTIVE thay vì xóa.`,
      );
    }

    await this.repo.delete(id);
    return { message: "Đã xóa chi nhánh." };
  }

  // ---------------------------------------------------------------------------
  // Rooms (theo branch)
  // ---------------------------------------------------------------------------

  async getRooms(branchId: string, role: string, userBranchId?: string | null) {
    const branch = await this.getBranch(branchId);
    if (
      (role === "STAFF" || role === "TRAINER") &&
      userBranchId &&
      branch.id !== userBranchId
    ) {
      throw new ForbiddenException(
        "Bạn không có quyền xem phòng của chi nhánh khác.",
      );
    }
    const rooms = await this.repo.roomsByBranch(branchId);
    return rooms.map((r) => this.shapeRoom(r));
  }

  async createRoom(branchId: string, dto: CreateRoomDto, role: string) {
    this.assertManage(role);
    await this.getBranch(branchId);

    const dup = await this.repo.roomFindByCode(branchId, dto.code);
    if (dup) {
      throw new ConflictException(
        `Mã phòng ${dto.code} đã tồn tại trong chi nhánh này.`,
      );
    }

    const { id } = await this.repo.roomCreate({
      branchId,
      code: dto.code,
      name: dto.name,
      type: dto.type ?? "GYM_AREA",
      capacity: dto.capacity ?? 20,
      floor: dto.floor ?? null,
      description: dto.description ?? null,
      status: dto.status ?? "AVAILABLE",
    });

    const room = await this.repo.roomFindOne(id, branchId);
    return {
      message: "Tạo phòng tập thành công.",
      room: room ? this.shapeRoom(room) : null,
    };
  }

  async updateRoom(
    branchId: string,
    roomId: string,
    dto: UpdateRoomDto,
    role: string,
  ) {
    this.assertManage(role);
    const room = await this.repo.roomFindOne(roomId, branchId);
    if (!room)
      throw new NotFoundException("Không tìm thấy phòng trong chi nhánh này.");

    if (dto.code) {
      const dup = await this.repo.roomFindByCode(branchId, dto.code, roomId);
      if (dup)
        throw new ConflictException(
          `Mã phòng ${dto.code} đã tồn tại trong chi nhánh này.`,
        );
    }

    await this.repo.roomUpdate(roomId, {
      code: dto.code,
      name: dto.name,
      type: dto.type,
      capacity: dto.capacity,
      floor: dto.floor,
      description: dto.description,
      status: dto.status,
    });

    const updated = await this.repo.roomFindOne(roomId, branchId);
    return {
      message: "Cập nhật phòng thành công.",
      room: updated ? this.shapeRoom(updated) : null,
    };
  }

  /** Đổi trạng thái phòng — session chỉ tạo được ở phòng AVAILABLE */
  async setRoomStatus(
    branchId: string,
    roomId: string,
    dto: SetRoomStatusDto,
    role: string,
  ) {
    this.assertManage(role);
    const room = await this.repo.roomFindOne(roomId, branchId);
    if (!room)
      throw new NotFoundException("Không tìm thấy phòng trong chi nhánh này.");

    if (dto.status !== "AVAILABLE") {
      const upcoming = await this.repo.upcomingSchedules(null, roomId);
      if (upcoming > 0) {
        throw new BadRequestException(
          `Phòng đang có ${upcoming} buổi tập chưa diễn ra. Hãy dời/hủy các buổi này trước khi đóng phòng.`,
        );
      }
    }

    await this.repo.roomSetStatus(roomId, dto.status);
    const updated = await this.repo.roomFindOne(roomId, branchId);
    return {
      message: "Đã cập nhật trạng thái phòng.",
      room: updated ? this.shapeRoom(updated) : null,
    };
  }

  async removeRoom(branchId: string, roomId: string, role: string) {
    this.assertManage(role);
    const room = await this.repo.roomFindOne(roomId, branchId);
    if (!room)
      throw new NotFoundException("Không tìm thấy phòng trong chi nhánh này.");

    const counts = await this.repo.roomRelatedCounts(roomId);
    const equipmentCount = Number(counts.equipmentCount ?? 0);
    const scheduleCount = Number(counts.scheduleCount ?? 0);
    if (equipmentCount > 0 || scheduleCount > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng còn ${equipmentCount} thiết bị và ${scheduleCount} buổi tập liên quan. Hãy chuyển sang trạng thái INACTIVE.`,
      );
    }

    await this.repo.roomDelete(roomId);
    return { message: "Đã xóa phòng." };
  }
}
