import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentCondition, EquipmentStatus, MaintenanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import {
  CompleteMaintenanceDto,
  CreateEquipmentDto,
  CreateMaintenanceDto,
  EquipmentQueryDto,
  MaintenanceQueryDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';

/** Vai trò được phép quản lý thiết bị (tạo/sửa/xóa/đổi trạng thái) */
const MANAGE_ROLES = ['ADMIN', 'MANAGER'];
/** STAFF chỉ được tạo/hoàn tất bảo trì thiết bị của chi nhánh mình */
const MAINTENANCE_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

@Injectable()
export class EquipmentService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private assertManage(role: string) {
    if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền quản lý thiết bị.');
    }
  }

  private async getEquipment(id: string) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');
    return equipment;
  }

  /** STAFF/TRAINER chỉ nhìn/móc thiết bị thuộc chi nhánh của mình */
  private assertBranchScope(branchId: string, role: string, userBranchId?: string | null) {
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId) {
      if (branchId !== userBranchId) {
        throw new ForbiddenException('Bạn chỉ được thao tác thiết bị thuộc chi nhánh của mình.');
      }
    }
  }

  private scopedWhere(role: string, userBranchId?: string | null): Prisma.EquipmentWhereInput {
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId) {
      return { branchId: userBranchId };
    }
    return {};
  }

  private includeBase() {
    return {
      branch: { select: { id: true, name: true, code: true } },
      room: { select: { id: true, name: true, code: true } },
      maintenances: {
        orderBy: { maintenanceDate: 'desc' },
        take: 3,
      },
    } satisfies Prisma.EquipmentInclude;
  }

  // ---------------------------------------------------------------------------
  // List / Detail / Stats / Alerts
  // ---------------------------------------------------------------------------

  async findAll(query: EquipmentQueryDto = {}, role = 'ADMIN', userBranchId?: string | null) {
    const { page = 1, limit = 20, search, category, status, condition, branchId, roomId } = query;
    const skip = (page - 1) * limit;

    const scope = this.scopedWhere(role, userBranchId);
    const where: Prisma.EquipmentWhereInput = { ...scope };
    // STAFF/TRAINER đã bị khóa ở chi nhánh của mình; chỉ ADMIN/MANAGER được lọc branch khác
    if (branchId && !scope.branchId) where.branchId = branchId;
    if (roomId) where.roomId = roomId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (condition) where.condition = condition;

    if (search) {
      const term = search.trim();
      if (term) {
        where.OR = [
          { code: { contains: term, mode: 'insensitive' } },
          { name: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { model: { contains: term, mode: 'insensitive' } },
          { serialNumber: { contains: term, mode: 'insensitive' } },
        ];
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        include: this.includeBase(),
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.equipment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, role = 'ADMIN', userBranchId?: string | null) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        branch: true,
        room: true,
        maintenances: {
          include: { equipment: { select: { id: true, code: true, name: true } } },
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');
    this.assertBranchScope(equipment.branchId, role, userBranchId);
    return equipment;
  }

  /** GET /equipment/stats — tổng quan thiết bị cho dashboard */
  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [total, byStatus, byCondition, overdue, upcoming, broken, warrantyExpiring, maintenanceThisMonth] =
      await Promise.all([
        this.prisma.equipment.count(),
        this.prisma.equipment.groupBy({ by: ['status'], _count: true }),
        this.prisma.equipment.groupBy({ by: ['condition'], _count: true }),
        this.prisma.equipment.count({
          where: {
            nextMaintenanceAt: { lt: now },
            status: { in: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE, EquipmentStatus.MAINTENANCE] },
          },
        }),
        this.prisma.equipment.count({
          where: {
            nextMaintenanceAt: { gte: now, lte: in14Days },
            status: { in: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE] },
          },
        }),
        this.prisma.equipment.count({ where: { status: EquipmentStatus.BROKEN } }),
        this.prisma.equipment.count({
          where: {
            warrantyExpiry: { gte: now, lte: in30Days },
            status: { not: EquipmentStatus.RETIRED },
          },
        }),
        this.prisma.equipmentMaintenance.count({
          where: { maintenanceDate: { gte: startOfMonth } },
        }),
      ]);

    const statusMap: Record<string, number> = {};
    for (const row of byStatus) statusMap[row.status] = row._count;
    const conditionMap: Record<string, number> = {};
    for (const row of byCondition) conditionMap[row.condition] = row._count;

    return {
      total,
      byStatus: statusMap,
      byCondition: conditionMap,
      available: statusMap[EquipmentStatus.AVAILABLE] ?? 0,
      inUse: statusMap[EquipmentStatus.IN_USE] ?? 0,
      maintenance: statusMap[EquipmentStatus.MAINTENANCE] ?? 0,
      broken: broken,
      retired: statusMap[EquipmentStatus.RETIRED] ?? 0,
      alerts: { overdue, upcoming, broken, warrantyExpiring },
      maintenanceThisMonth,
    };
  }

  /** GET /equipment/alerts — cảnh báo bảo trì quá hạn / sắp tới / hỏng / hết bảo hành */
  async getAlerts(role = 'ADMIN', userBranchId?: string | null) {
    const now = new Date();
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const scope = this.scopedWhere(role, userBranchId);
    const select = {
      id: true,
      code: true,
      name: true,
      status: true,
      nextMaintenanceAt: true,
      warrantyExpiry: true,
      branch: { select: { id: true, name: true, code: true } },
      room: { select: { id: true, name: true } },
    } satisfies Prisma.EquipmentSelect;

    const [overdue, upcoming, broken, warranty] = await Promise.all([
      this.prisma.equipment.findMany({
        where: {
          ...scope,
          nextMaintenanceAt: { lt: now },
          status: { in: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE, EquipmentStatus.MAINTENANCE] },
        },
        select,
        orderBy: { nextMaintenanceAt: 'asc' },
        take: 50,
      }),
      this.prisma.equipment.findMany({
        where: {
          ...scope,
          nextMaintenanceAt: { gte: now, lte: in14Days },
          status: { in: [EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE] },
        },
        select,
        orderBy: { nextMaintenanceAt: 'asc' },
        take: 50,
      }),
      this.prisma.equipment.findMany({
        where: { ...scope, status: EquipmentStatus.BROKEN },
        select,
        orderBy: { updatedAt: 'desc' },
        take: 50,
      }),
      this.prisma.equipment.findMany({
        where: { ...scope, warrantyExpiry: { gte: now, lte: in30Days }, status: { not: EquipmentStatus.RETIRED } },
        select,
        orderBy: { warrantyExpiry: 'asc' },
        take: 50,
      }),
    ]);

    return {
      counts: {
        overdue: overdue.length,
        upcoming: upcoming.length,
        broken: broken.length,
        warranty: warranty.length,
        total: overdue.length + upcoming.length + broken.length + warranty.length,
      },
      overdue,
      upcoming,
      broken,
      warranty,
    };
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(dto: CreateEquipmentDto, role: string, actorId?: string) {
    this.assertManage(role);

    const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh.');

    const dupCode = await this.prisma.equipment.findUnique({ where: { code: dto.code } });
    if (dupCode) throw new ConflictException(`Mã thiết bị ${dto.code} đã tồn tại.`);

    if (dto.serialNumber) {
      const dupSerial = await this.prisma.equipment.findUnique({
        where: { serialNumber: dto.serialNumber },
        select: { id: true },
      });
      if (dupSerial) {
        throw new ConflictException(`Số serial ${dto.serialNumber} đã được sử dụng bởi thiết bị khác.`);
      }
    }

    if (dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, branchId: dto.branchId },
        select: { id: true },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc chi nhánh của thiết bị.');
      }
    }

    const equipment = await this.prisma.equipment.create({
      data: {
        code: dto.code,
        name: dto.name,
        category: dto.category,
        branchId: dto.branchId,
        roomId: dto.roomId ?? null,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        serialNumber: dto.serialNumber ?? null,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice ?? null,
        warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null,
        status: dto.status ?? EquipmentStatus.AVAILABLE,
        condition: dto.condition ?? EquipmentCondition.GOOD,
        nextMaintenanceAt: dto.nextMaintenanceAt ? new Date(dto.nextMaintenanceAt) : null,
        description: dto.description ?? null,
      },
      include: this.includeBase(),
    });

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_CREATE',
      entity: 'Equipment',
      entityId: equipment.id,
      metadata: { code: equipment.code, name: equipment.name, category: dto.category },
    });

    return { message: 'Thêm thiết bị thành công.', equipment };
  }

  async update(id: string, dto: UpdateEquipmentDto, role: string, actorId?: string) {
    this.assertManage(role);
    const existing = await this.getEquipment(id);

    if (dto.code && dto.code !== existing.code) {
      const dup = await this.prisma.equipment.findFirst({
        where: { code: dto.code, id: { not: id } },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Mã thiết bị ${dto.code} đã được sử dụng bởi thiết bị khác.`);
    }

    if (dto.serialNumber && dto.serialNumber !== existing.serialNumber) {
      const dup = await this.prisma.equipment.findFirst({
        where: { serialNumber: dto.serialNumber, id: { not: id } },
        select: { id: true },
      });
      if (dup) throw new ConflictException(`Số serial ${dto.serialNumber} đã được sử dụng bởi thiết bị khác.`);
    }

    if (dto.roomId !== undefined && dto.roomId) {
      const room = await this.prisma.room.findFirst({
        where: { id: dto.roomId, branchId: dto.branchId ?? existing.branchId },
        select: { id: true },
      });
      if (!room) {
        throw new BadRequestException('Phòng được chọn không thuộc chi nhánh của thiết bị.');
      }
    }

    const data: Prisma.EquipmentUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.roomId !== undefined) data.room = dto.roomId ? { connect: { id: dto.roomId } } : { disconnect: true };
    if (dto.brand !== undefined) data.brand = dto.brand;
    if (dto.model !== undefined) data.model = dto.model;
    if (dto.serialNumber !== undefined) data.serialNumber = dto.serialNumber;
    if (dto.purchaseDate !== undefined)
      data.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (dto.purchasePrice !== undefined) data.purchasePrice = dto.purchasePrice;
    if (dto.warrantyExpiry !== undefined)
      data.warrantyExpiry = dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.nextMaintenanceAt !== undefined)
      data.nextMaintenanceAt = dto.nextMaintenanceAt ? new Date(dto.nextMaintenanceAt) : null;
    if (dto.description !== undefined) data.description = dto.description;

    const equipment = await this.prisma.equipment.update({
      where: { id },
      data,
      include: this.includeBase(),
    });

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_UPDATE',
      entity: 'Equipment',
      entityId: id,
      metadata: { code: existing.code, fields: Object.keys(dto) },
    });

    return { message: 'Cập nhật thiết bị thành công.', equipment };
  }

  /** Đổi trạng thái nhanh (AVAILABLE / IN_USE / MAINTENANCE / BROKEN / RETIRED) */
  async setStatus(
    id: string,
    status: EquipmentStatus,
    role: string,
    userBranchId?: string | null,
    actorId?: string,
  ) {
    this.assertManage(role);
    const existing = await this.getEquipment(id);
    this.assertBranchScope(existing.branchId, role, userBranchId);

    const equipment = await this.prisma.equipment.update({
      where: { id },
      data: { status },
      include: this.includeBase(),
    });

    // STEP 8 — thiết bị hỏng → cảnh báo ADMIN/MANAGER/STAFF (dedupe theo ref)
    if (status === EquipmentStatus.BROKEN) {
      await this.notificationsService.fanoutToStaff({
        type: 'EQUIPMENT',
        title: 'Thiết bị hỏng 🚨',
        content: `${equipment.name} (${equipment.code}) tại ${equipment.branch?.name ?? ''} vừa được đánh dấu HỎNG. Kiểm tra và lên lịch sửa chữa.`,
        link: '/admin/equipment',
        referenceType: 'EQUIPMENT_BROKEN',
        referenceId: equipment.id,
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_STATUS_CHANGE',
      entity: 'Equipment',
      entityId: id,
      metadata: { code: existing.code, from: existing.status, to: status },
    });

    return { message: 'Đã cập nhật trạng thái thiết bị.', equipment };
  }

  /** Retire (soft-delete): giữ lịch sử, chuyển sang RETIRED */
  async remove(id: string, role: string, userBranchId?: string | null, actorId?: string) {
    this.assertManage(role);
    const existing = await this.getEquipment(id);
    this.assertBranchScope(existing.branchId, role, userBranchId);

    if (existing.status === EquipmentStatus.RETIRED) {
      throw new BadRequestException('Thiết bị này đã ở trạng thái thanh lý (RETIRED).');
    }

    // Chặn thanh lý khi đang có bảo trì dở dang
    const activeMaintenance = await this.prisma.equipmentMaintenance.findFirst({
      where: { equipmentId: id, status: { in: ['IN_PROGRESS', 'SCHEDULED'] as MaintenanceStatus[] } },
      select: { id: true },
    });
    if (activeMaintenance) {
      throw new BadRequestException('Thiết bị đang có yêu cầu bảo trì dở dang. Hãy hoàn tất/hủy trước khi thanh lý.');
    }

    const equipment = await this.prisma.equipment.update({
      where: { id },
      data: { status: EquipmentStatus.RETIRED },
      include: this.includeBase(),
    });

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_RETIRE',
      entity: 'Equipment',
      entityId: id,
      metadata: { code: existing.code, from: existing.status, to: EquipmentStatus.RETIRED },
    });

    return { message: 'Đã thanh lý (retire) thiết bị. Lịch sử bảo trì được giữ lại.', equipment };
  }

  // ---------------------------------------------------------------------------
  // Maintenance
  // ---------------------------------------------------------------------------

  private async getMaintenance(id: string) {
    const record = await this.prisma.equipmentMaintenance.findUnique({
      where: { id },
      include: { equipment: { select: { id: true, branchId: true } } },
    });
    if (!record) throw new NotFoundException('Không tìm thấy yêu cầu bảo trì.');
    return record;
  }

  async findAllMaintenance(query: MaintenanceQueryDto = {}, role = 'ADMIN', userBranchId?: string | null) {
    const { page = 1, limit = 20, equipmentId, branchId, status, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EquipmentMaintenanceWhereInput = {};
    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (branchId) where.equipment = { is: { branchId } };
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId) {
      where.equipment = { is: { branchId: userBranchId } };
    }

    const [data, total] = await Promise.all([
      this.prisma.equipmentMaintenance.findMany({
        where,
        include: {
          equipment: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              branch: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: { maintenanceDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.equipmentMaintenance.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Tạo yêu cầu bảo trì — thiết bị AVAILABLE/IN_USE → MAINTENANCE (STAFF chỉ thiết bị chi nhánh mình) */
  async createMaintenance(
    dto: CreateMaintenanceDto,
    role: string,
    userBranchId?: string | null,
    actorId?: string,
  ) {
    if (!MAINTENANCE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền tạo yêu cầu bảo trì.');
    }
    const equipment = await this.getEquipment(dto.equipmentId);
    this.assertBranchScope(equipment.branchId, role, userBranchId);

    if (equipment.status === EquipmentStatus.RETIRED) {
      throw new BadRequestException('Thiết bị đã thanh lý, không thể tạo bảo trì.');
    }

    const status = dto.status ?? MaintenanceStatus.IN_PROGRESS;

    const record = await this.prisma.equipmentMaintenance.create({
      data: {
        equipmentId: equipment.id,
        type: dto.type ?? 'ROUTINE',
        maintenanceDate: dto.maintenanceDate ? new Date(dto.maintenanceDate) : new Date(),
        cost: dto.cost ?? null,
        description: dto.description,
        performedBy: dto.performedBy ?? null,
        status,
        nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
      },
      include: {
        equipment: {
          select: { id: true, code: true, name: true, branch: { select: { id: true, name: true } } },
        },
      },
    });

    // Thiết bị chuyển sang MAINTENANCE khi bắt đầu bảo trì (trừ khi đã hỏng)
    if (status !== MaintenanceStatus.SCHEDULED && equipment.status !== EquipmentStatus.BROKEN) {
      await this.prisma.equipment.update({
        where: { id: equipment.id },
        data: { status: EquipmentStatus.MAINTENANCE },
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: 'MAINTENANCE_CREATE',
      entity: 'EquipmentMaintenance',
      entityId: record.id,
      metadata: {
        equipmentId: equipment.id,
        equipmentCode: equipment.code,
        type: record.type,
        status: record.status,
        cost: record.cost,
      },
    });

    return {
      message:
        status === MaintenanceStatus.SCHEDULED
          ? 'Đã lên lịch bảo trì.'
          : 'Đã tạo yêu cầu bảo trì. Thiết bị chuyển sang trạng thái MAINTENANCE.',
      maintenance: record,
    };
  }

  /** Hoàn tất bảo trì — thiết bị MAINTENANCE → AVAILABLE (hoặc BROKEN nếu đánh dấu hỏng) */
  async completeMaintenance(
    id: string,
    dto: CompleteMaintenanceDto,
    role: string,
    userBranchId?: string | null,
    actorId?: string,
  ) {
    if (!MAINTENANCE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền hoàn tất bảo trì.');
    }
    const record = await this.getMaintenance(id);
    this.assertBranchScope(record.equipment.branchId, role, userBranchId);

    if (record.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Yêu cầu bảo trì này đã hoàn tất trước đó.');
    }
    if (record.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException('Yêu cầu bảo trì đã bị hủy, không thể hoàn tất.');
    }

    const now = new Date();
    const equipment = await this.prisma.equipment.update({
      where: { id: record.equipmentId },
      data: {
        status: dto.markBroken ? EquipmentStatus.BROKEN : EquipmentStatus.AVAILABLE,
        condition: dto.condition ?? undefined,
        lastMaintenanceAt: now,
        nextMaintenanceAt:
          dto.nextDueDate !== undefined
            ? dto.nextDueDate
              ? new Date(dto.nextDueDate)
              : null
            : record.nextDueDate,
      },
      include: this.includeBase(),
    });

    const updated = await this.prisma.equipmentMaintenance.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        cost: dto.cost ?? record.cost,
        performedBy: dto.performedBy ?? record.performedBy,
        description: dto.description ?? record.description,
        nextDueDate: equipment.nextMaintenanceAt,
      },
    });

    // STEP 8 — hoàn tất bảo trì nhưng thiết bị hỏng → cảnh báo
    if (dto.markBroken) {
      await this.notificationsService.fanoutToStaff({
        type: 'EQUIPMENT',
        title: 'Thiết bị hỏng 🚨',
        content: `${equipment.name} (${equipment.code}) tại ${equipment.branch?.name ?? ''} được xác định HỎNG sau bảo trì. Lên kế hoạch sửa chữa / thay thế.`,
        link: '/admin/equipment',
        referenceType: 'EQUIPMENT_BROKEN',
        referenceId: equipment.id,
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: 'MAINTENANCE_COMPLETE',
      entity: 'EquipmentMaintenance',
      entityId: id,
      metadata: {
        equipmentId: equipment.id,
        equipmentCode: equipment.code,
        cost: updated.cost,
        markBroken: dto.markBroken ?? false,
        newEquipmentStatus: equipment.status,
      },
    });

    return {
      message: dto.markBroken
        ? 'Đã hoàn tất bảo trì. Thiết bị được đánh dấu HỎNG (BROKEN).'
        : 'Hoàn tất bảo trì. Thiết bị đã sẵn sàng sử dụng (AVAILABLE).',
      maintenance: updated,
      equipment,
    };
  }

  /** Hủy yêu cầu bảo trì — trả thiết bị về AVAILABLE nếu không còn bảo trì đang chạy */
  async cancelMaintenance(
    id: string,
    role: string,
    userBranchId?: string | null,
    actorId?: string,
  ) {
    if (!MAINTENANCE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu bảo trì.');
    }
    const record = await this.getMaintenance(id);
    this.assertBranchScope(record.equipment.branchId, role, userBranchId);

    if (record.status === MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Yêu cầu bảo trì đã hoàn tất, không thể hủy.');
    }
    if (record.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException('Yêu cầu bảo trì đã bị hủy trước đó.');
    }

    const updated = await this.prisma.equipmentMaintenance.update({
      where: { id },
      data: { status: MaintenanceStatus.CANCELLED },
    });

    // Nếu không còn bảo trì nào đang chạy → mở lại thiết bị
    const active = await this.prisma.equipmentMaintenance.findFirst({
      where: {
        equipmentId: record.equipmentId,
        status: { in: [MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS] },
      },
      select: { id: true },
    });
    if (!active) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: record.equipmentId },
        select: { status: true },
      });
      if (equipment?.status === EquipmentStatus.MAINTENANCE) {
        await this.prisma.equipment.update({
          where: { id: record.equipmentId },
          data: { status: EquipmentStatus.AVAILABLE },
        });
      }
    }

    await this.auditService.log({
      userId: actorId,
      action: 'MAINTENANCE_CANCEL',
      entity: 'EquipmentMaintenance',
      entityId: id,
      metadata: { equipmentId: record.equipmentId, from: record.status, to: 'CANCELLED' },
    });

    return { message: 'Đã hủy yêu cầu bảo trì. Thiết bị được mở lại (nếu không còn bảo trì khác).', maintenance: updated };
  }
}