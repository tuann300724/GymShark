import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateBranchDto,
  CreateRoomDto,
  SetBranchStatusDto,
  SetRoomStatusDto,
  UpdateBranchDto,
  UpdateRoomDto,
} from './dto/branch.dto';

/** Vai trò quản lý chi nhánh (create/update/status) */
const MANAGE_ROLES = ['ADMIN', 'MANAGER'];

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private assertManage(role: string) {
    if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền quản lý chi nhánh.');
    }
  }

  private async getBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh.');
    return branch;
  }

  /** STAFF/TRAINER chỉ nhìn thấy chi nhánh của chính mình */
  private scopedWhere(role: string, userBranchId?: string | null): Prisma.BranchWhereInput {
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId) {
      return { id: userBranchId };
    }
    return {};
  }

  private buildBranchInclude() {
    return {
      _count: {
        select: {
          members: true,
          equipment: true,
          rooms: true,
          users: true,
          schedules: true,
        },
      },
      rooms: {
        select: { id: true, code: true, name: true, type: true, capacity: true, status: true },
        orderBy: { code: 'asc' as const },
        take: 50,
      },
    } satisfies Prisma.BranchInclude;
  }

  // ---------------------------------------------------------------------------
  // Branch: list / detail / stats
  // ---------------------------------------------------------------------------

  async findAll(role = 'ADMIN', userBranchId?: string | null) {
    return this.prisma.branch.findMany({
      where: this.scopedWhere(role, userBranchId),
      include: this.buildBranchInclude(),
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, role = 'ADMIN', userBranchId?: string | null) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        ...this.buildBranchInclude(),
        equipment: {
          include: {
            room: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh.');
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId && branch.id !== userBranchId) {
      throw new ForbiddenException('Bạn không có quyền xem chi nhánh khác.');
    }
    return branch;
  }

  /** GET /branches/:id/stats — số liệu tổng hợp cho dashboard chi nhánh */
  async getStats(id: string) {
    const branch = await this.getBranch(id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      activeMemberRows,
      totalTrainers,
      equipmentCount,
      equipmentByStatus,
      roomAvailable,
      roomCount,
      checkInsToday,
      revenueThisMonth,
      upcomingSessions,
    ] = await Promise.all([
      this.prisma.member.count({ where: { branchId: id } }),
      this.prisma.membership.findMany({
        where: { status: 'ACTIVE', endDate: { gte: now }, member: { branchId: id } },
        select: { memberId: true },
        distinct: ['memberId'],
      }),
      this.prisma.trainer.count({ where: { status: 'ACTIVE', user: { branchId: id } } }),
      this.prisma.equipment.count({ where: { branchId: id } }),
      this.prisma.equipment.groupBy({
        by: ['status'],
        where: { branchId: id },
        _count: true,
      }),
      this.prisma.room.count({ where: { branchId: id, status: 'AVAILABLE' } }),
      this.prisma.room.count({ where: { branchId: id } }),
      this.prisma.checkIn.count({ where: { branchId: id, checkInTime: { gte: startOfToday } } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', member: { is: { branchId: id } }, paidAt: { gte: startOfMonth } },
      }),
      this.prisma.trainingSchedule.count({
        where: { branchId: id, status: 'SCHEDULED', startTime: { gte: now } },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    for (const row of equipmentByStatus) statusMap[row.status] = row._count;

    return {
      branchId: id,
      totalMembers,
      activeMembers: activeMemberRows.length,
      totalTrainers,
      equipmentCount,
      equipmentByStatus: statusMap,
      roomAvailable,
      roomCount,
      checkInsToday,
      revenueThisMonth: revenueThisMonth._sum.amount || 0,
      upcomingSessions,
    };
  }

  // ---------------------------------------------------------------------------
  // Branch: create / update / status / delete
  // ---------------------------------------------------------------------------

  async create(dto: CreateBranchDto, role: string) {
    this.assertManage(role);

    const existing = await this.prisma.branch.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException(`Mã chi nhánh ${dto.code} đã tồn tại.`);
    }

    const branch = await this.prisma.branch.create({
      data: {
        code: dto.code,
        name: dto.name,
        address: dto.address,
        phone: dto.phone,
        email: dto.email ?? null,
        description: dto.description ?? null,
        openingTime: dto.openingTime ?? null,
        closingTime: dto.closingTime ?? null,
        openingHours: dto.openingHours ?? null,
        status: dto.status ?? 'ACTIVE',
      },
      include: this.buildBranchInclude(),
    });

    return { message: 'Tạo chi nhánh thành công.', branch };
  }

  async update(id: string, dto: UpdateBranchDto, role: string) {
    this.assertManage(role);
    await this.getBranch(id);

    if (dto.code) {
      const dup = await this.prisma.branch.findFirst({
        where: { code: dto.code, id: { not: id } },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Mã chi nhánh ${dto.code} đã được sử dụng bởi chi nhánh khác.`);
    }

    const data: Prisma.BranchUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.openingTime !== undefined) data.openingTime = dto.openingTime;
    if (dto.closingTime !== undefined) data.closingTime = dto.closingTime;
    if (dto.openingHours !== undefined) data.openingHours = dto.openingHours;
    if (dto.status !== undefined) data.status = dto.status;

    const branch = await this.prisma.branch.update({
      where: { id },
      data,
      include: this.buildBranchInclude(),
    });

    return { message: 'Cập nhật chi nhánh thành công.', branch };
  }

  /** Kích hoạt / ngừng hoạt động chi nhánh — INACTIVE chặn tạo buổi tập & check-in mới */
  async setStatus(id: string, dto: SetBranchStatusDto, role: string) {
    this.assertManage(role);
    const branch = await this.getBranch(id);

    if (branch.status === dto.status) {
      return { message: 'Chi nhánh đã ở trạng thái này.', branch };
    }

    if (dto.status === 'INACTIVE') {
      // Không cho ngừng hoạt động nếu còn buổi tập chưa diễn ra (tránh phá lịch đã đặt)
      const upcoming = await this.prisma.trainingSchedule.count({
        where: { branchId: id, status: 'SCHEDULED', startTime: { gte: new Date() } },
      });
      if (upcoming > 0) {
        throw new BadRequestException(
          `Chi nhánh đang có ${upcoming} buổi tập chưa diễn ra (SCHEDULED). Hãy hủy/dời các buổi này trước khi ngừng hoạt động.`,
        );
      }
    }

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { status: dto.status },
      include: this.buildBranchInclude(),
    });

    return {
      message:
        dto.status === 'ACTIVE'
          ? 'Chi nhánh đã được kích hoạt lại.'
          : 'Chi nhánh đã ngừng hoạt động. Không thể tạo buổi tập / check-in mới tại chi nhánh này.',
      branch: updated,
    };
  }

  /** Xóa chi nhánh — chỉ khi không còn dữ liệu liên quan (an toàn dữ liệu) */
  async remove(id: string, role: string) {
    this.assertManage(role);
    await this.getBranch(id);

    const [
      memberCount,
      checkInCount,
      equipmentCount,
      roomCount,
      scheduleCount,
      userCount,
    ] = await Promise.all([
      this.prisma.member.count({ where: { branchId: id } }),
      this.prisma.checkIn.count({ where: { branchId: id } }),
      this.prisma.equipment.count({ where: { branchId: id } }),
      this.prisma.room.count({ where: { branchId: id } }),
      this.prisma.trainingSchedule.count({ where: { branchId: id } }),
      this.prisma.user.count({ where: { branchId: id } }),
    ]);

    const total = memberCount + checkInCount + equipmentCount + roomCount + scheduleCount + userCount;
    if (total > 0) {
      throw new BadRequestException(
        `Không thể xóa chi nhánh còn dữ liệu (${total} bản ghi liên quan: hội viên, check-in, thiết bị, phòng, lịch tập, tài khoản). Hãy chuyển sang trạng thái INACTIVE thay vì xóa.`,
      );
    }

    await this.prisma.branch.delete({ where: { id } });
    return { message: 'Đã xóa chi nhánh.' };
  }

  // ---------------------------------------------------------------------------
  // Rooms (theo branch) — quản lý trong tab của trang chi nhánh
  // ---------------------------------------------------------------------------

  async getRooms(branchId: string, role: string, userBranchId?: string | null) {
    const branch = await this.getBranch(branchId);
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId && branch.id !== userBranchId) {
      throw new ForbiddenException('Bạn không có quyền xem phòng của chi nhánh khác.');
    }
    return this.prisma.room.findMany({
      where: { branchId },
      include: {
        _count: { select: { equipment: true, schedules: true } },
      },
      orderBy: [{ code: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createRoom(branchId: string, dto: CreateRoomDto, role: string) {
    this.assertManage(role);
    await this.getBranch(branchId);

    const dup = await this.prisma.room.findFirst({
      where: { branchId, code: dto.code },
      select: { id: true },
    });
    if (dup) {
      throw new ConflictException(`Mã phòng ${dto.code} đã tồn tại trong chi nhánh này.`);
    }

    const room = await this.prisma.room.create({
      data: {
        branchId,
        code: dto.code,
        name: dto.name,
        type: dto.type ?? 'GYM_AREA',
        capacity: dto.capacity ?? 20,
        floor: dto.floor ?? null,
        description: dto.description ?? null,
        status: dto.status ?? 'AVAILABLE',
      },
      include: { _count: { select: { equipment: true, schedules: true } } },
    });

    return { message: 'Tạo phòng tập thành công.', room };
  }

  async updateRoom(branchId: string, roomId: string, dto: UpdateRoomDto, role: string) {
    this.assertManage(role);
    const room = await this.prisma.room.findFirst({ where: { id: roomId, branchId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng trong chi nhánh này.');

    if (dto.code) {
      const dup = await this.prisma.room.findFirst({
        where: { branchId, code: dto.code, id: { not: roomId } },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Mã phòng ${dto.code} đã tồn tại trong chi nhánh này.`);
    }

    const data: Prisma.RoomUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.floor !== undefined) data.floor = dto.floor;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data,
      include: { _count: { select: { equipment: true, schedules: true } } },
    });

    return { message: 'Cập nhật phòng thành công.', room: updated };
  }

  /** Đổi trạng thái phòng — session chỉ tạo được ở phòng AVAILABLE */
  async setRoomStatus(branchId: string, roomId: string, dto: SetRoomStatusDto, role: string) {
    this.assertManage(role);
    const room = await this.prisma.room.findFirst({ where: { id: roomId, branchId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng trong chi nhánh này.');

    if (dto.status !== 'AVAILABLE') {
      // Không cho đóng phòng nếu còn buổi tập chưa diễn ra
      const upcoming = await this.prisma.trainingSchedule.count({
        where: { roomId, status: 'SCHEDULED', startTime: { gte: new Date() } },
      });
      if (upcoming > 0) {
        throw new BadRequestException(
          `Phòng đang có ${upcoming} buổi tập chưa diễn ra. Hãy dời/hủy các buổi này trước khi đóng phòng.`,
        );
      }
    }

    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { status: dto.status },
      include: { _count: { select: { equipment: true, schedules: true } } },
    });

    return { message: 'Đã cập nhật trạng thái phòng.', room: updated };
  }

  async removeRoom(branchId: string, roomId: string, role: string) {
    this.assertManage(role);
    const room = await this.prisma.room.findFirst({ where: { id: roomId, branchId } });
    if (!room) throw new NotFoundException('Không tìm thấy phòng trong chi nhánh này.');

    const [equipmentCount, scheduleCount] = await Promise.all([
      this.prisma.equipment.count({ where: { roomId } }),
      this.prisma.trainingSchedule.count({ where: { roomId } }),
    ]);
    if (equipmentCount > 0 || scheduleCount > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng còn ${equipmentCount} thiết bị và ${scheduleCount} buổi tập liên quan. Hãy chuyển sang trạng thái INACTIVE.`,
      );
    }

    await this.prisma.room.delete({ where: { id: roomId } });
    return { message: 'Đã xóa phòng.' };
  }
}