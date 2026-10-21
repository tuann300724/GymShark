import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EquipmentCondition, EquipmentStatus, MaintenanceStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { EquipmentRepository } from './repository/equipment.repository';
import { EQUIPMENT_REPOSITORY } from './repository/equipment.tokens';
import { Inject } from '@nestjs/common';
import {
  CompleteMaintenanceDto,
  CreateEquipmentDto,
  CreateMaintenanceDto,
  EquipmentQueryDto,
  MaintenanceQueryDto,
  UpdateEquipmentDto,
} from './dto/equipment.dto';

const MANAGE_ROLES = ['ADMIN', 'MANAGER'];
const MAINTENANCE_ROLES = ['ADMIN', 'MANAGER', 'STAFF'];

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY) private repo: EquipmentRepository,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  private assertManage(role: string) {
    if (!MANAGE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền quản lý thiết bị.');
    }
  }

  private async getEquipment(id: string) {
    const equipment = await this.repo.findEquipment(id);
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');
    return equipment;
  }

  private assertBranchScope(branchId: string, role: string, userBranchId?: string | null) {
    if ((role === 'STAFF' || role === 'TRAINER') && userBranchId) {
      if (branchId !== userBranchId) {
        throw new ForbiddenException('Bạn chỉ được thao tác thiết bị thuộc chi nhánh của mình.');
      }
    }
  }

  async findAll(query: EquipmentQueryDto = {}, role = 'ADMIN', userBranchId?: string | null) {
    const { page = 1, limit = 20, search, category, status, condition, branchId, roomId } = query;
    const scopeBranch = (role === 'STAFF' || role === 'TRAINER') ? userBranchId || null : null;
    const effectiveBranch = scopeBranch ?? branchId ?? null;

    const [data, total] = await Promise.all([
      this.repo.listEquipment({
        page,
        limit,
        search: search ?? null,
        category: category ?? null,
        status: status ?? null,
        condition: condition ?? null,
        branchId: effectiveBranch,
        roomId: roomId ?? null,
      }),
      this.repo.countEquipment({
        search: search ?? null,
        category: category ?? null,
        status: status ?? null,
        condition: condition ?? null,
        branchId: effectiveBranch,
        roomId: roomId ?? null,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, role = 'ADMIN', userBranchId?: string | null) {
    const equipment = await this.repo.findEquipment(id);
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');
    this.assertBranchScope(equipment.branchId, role, userBranchId);
    return equipment;
  }

  async getStats() {
    return this.repo.equipmentStats();
  }

  async getAlerts(role = 'ADMIN', userBranchId?: string | null) {
    const scope = (role === 'STAFF' || role === 'TRAINER') ? userBranchId ?? null : null;
    return this.repo.equipmentAlerts(scope);
  }

  async create(dto: CreateEquipmentDto, role: string, actorId?: string) {
    this.assertManage(role);

    const branch = await this.repo.findBranchById(dto.branchId);
    if (!branch) throw new NotFoundException('Không tìm thấy chi nhánh.');

    const dupCode = await this.repo.findEquipmentByCode(dto.code);
    if (dupCode) throw new ConflictException(`Mã thiết bị ${dto.code} đã tồn tại.`);

    if (dto.serialNumber) {
      const dupSerial = await this.repo.findEquipmentBySerial(dto.serialNumber);
      if (dupSerial) throw new ConflictException(`Số serial ${dto.serialNumber} đã được sử dụng bởi thiết bị khác.`);
    }

    if (dto.roomId) {
      const ok = await this.repo.roomBelongsToBranch(dto.roomId, dto.branchId);
      if (!ok) throw new BadRequestException('Phòng được chọn không thuộc chi nhánh của thiết bị.');
    }

    const equipment = await this.repo.createEquipment({
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

    if (dto.code !== undefined && dto.code !== existing.code) {
      const dup = await this.repo.findEquipmentByCode(dto.code);
      if (dup && dup.id !== id) throw new ConflictException(`Mã thiết bị ${dto.code} đã được sử dụng bởi thiết bị khác.`);
    }

    if (dto.serialNumber !== undefined && dto.serialNumber !== existing.serialNumber) {
      const dup = await this.repo.findEquipmentBySerial(dto.serialNumber, id);
      if (dup) throw new ConflictException(`Số serial ${dto.serialNumber} đã được sử dụng bởi thiết bị khác.`);
    }

    if (dto.roomId !== undefined && dto.roomId) {
      const branchId = dto.branchId ?? existing.branchId;
      const ok = await this.repo.roomBelongsToBranch(dto.roomId, branchId);
      if (!ok) throw new BadRequestException('Phòng được chọn không thuộc chi nhánh của thiết bị.');
    }

    const has = (k: keyof UpdateEquipmentDto) => Object.prototype.hasOwnProperty.call(dto, k) && dto[k] !== undefined;
    const input: any = {};
    if (has('code')) input.code = dto.code;
    if (has('name')) input.name = dto.name;
    if (has('category')) input.category = dto.category;
    if (has('branchId')) input.branchId = dto.branchId;
    if (has('roomId')) input.roomId = dto.roomId;
    if (has('brand')) input.brand = dto.brand;
    if (has('model')) input.model = dto.model;
    if (has('serialNumber')) input.serialNumber = dto.serialNumber;
    if (has('purchaseDate')) input.purchaseDate = dto.purchaseDate ? new Date(dto.purchaseDate) : null;
    if (has('purchasePrice')) input.purchasePrice = dto.purchasePrice;
    if (has('warrantyExpiry')) input.warrantyExpiry = dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : null;
    if (has('status')) input.status = dto.status;
    if (has('condition')) input.condition = dto.condition;
    if (has('nextMaintenanceAt')) input.nextMaintenanceAt = dto.nextMaintenanceAt ? new Date(dto.nextMaintenanceAt) : null;
    if (has('description')) input.description = dto.description;

    const equipment = await this.repo.updateEquipment(id, input);
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị khi cập nhật.');

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_UPDATE',
      entity: 'Equipment',
      entityId: id,
      metadata: { code: existing.code, fields: Object.keys(dto) },
    });

    return { message: 'Cập nhật thiết bị thành công.', equipment };
  }

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

    const equipment = await this.repo.setEquipmentStatus(id, status);
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');

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

  async remove(id: string, role: string, userBranchId?: string | null, actorId?: string) {
    this.assertManage(role);
    const existing = await this.getEquipment(id);
    this.assertBranchScope(existing.branchId, role, userBranchId);

    if (existing.status === EquipmentStatus.RETIRED) {
      throw new BadRequestException('Thiết bị này đã ở trạng thái thanh lý (RETIRED).');
    }

    const activeMaintenance = await this.repo.hasActiveMaintenance(id);
    if (activeMaintenance) {
      throw new BadRequestException('Thiết bị đang có yêu cầu bảo trì dở dang. Hãy hoàn tất/hủy trước khi thanh lý.');
    }

    const equipment = await this.repo.setEquipmentStatus(id, EquipmentStatus.RETIRED);
    if (!equipment) throw new NotFoundException('Không tìm thấy thiết bị.');

    await this.auditService.log({
      userId: actorId,
      action: 'EQUIPMENT_RETIRE',
      entity: 'Equipment',
      entityId: id,
      metadata: { code: existing.code, from: existing.status, to: EquipmentStatus.RETIRED },
    });

    return { message: 'Đã thanh lý (retire) thiết bị. Lịch sử bảo trì được giữ lại.', equipment };
  }

  async findAllMaintenance(query: MaintenanceQueryDto = {}, role = 'ADMIN', userBranchId?: string | null) {
    const { page = 1, limit = 20, equipmentId, branchId, status, type } = query;
    const scopeBranch = (role === 'STAFF' || role === 'TRAINER') ? userBranchId || null : null;
    const effectiveBranch = scopeBranch ?? branchId ?? null;

    const [data, total] = await Promise.all([
      this.repo.listMaintenance({
        page,
        limit,
        equipmentId: equipmentId ?? null,
        branchId: effectiveBranch,
        status: status ?? null,
        type: type ?? null,
      }),
      this.repo.countMaintenance({
        equipmentId: equipmentId ?? null,
        branchId: effectiveBranch,
        status: status ?? null,
        type: type ?? null,
      }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

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
    const record = await this.repo.createMaintenance({
      equipmentId: equipment.id,
      type: dto.type ?? 'ROUTINE',
      maintenanceDate: dto.maintenanceDate ? new Date(dto.maintenanceDate) : new Date(),
      cost: dto.cost ?? null,
      description: dto.description,
      performedBy: dto.performedBy ?? null,
      status,
      nextDueDate: dto.nextDueDate ? new Date(dto.nextDueDate) : null,
    });

    if (status !== MaintenanceStatus.SCHEDULED && equipment.status !== EquipmentStatus.BROKEN) {
      await this.repo.setEquipmentStatus(equipment.id, EquipmentStatus.MAINTENANCE);
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
      message: status === MaintenanceStatus.SCHEDULED ? 'Đã lên lịch bảo trì.' : 'Đã tạo yêu cầu bảo trì. Thiết bị chuyển sang trạng thái MAINTENANCE.',
      maintenance: record,
    };
  }

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
    const record = await this.repo.findMaintenance(id);
    if (!record) throw new NotFoundException('Không tìm thấy yêu cầu bảo trì.');
    this.assertBranchScope(record.equipment?.branch?.id ?? '', role, userBranchId);

    if (record.status === MaintenanceStatus.COMPLETED) throw new BadRequestException('Yêu cầu bảo trì này đã hoàn tất trước đó.');
    if (record.status === MaintenanceStatus.CANCELLED) throw new BadRequestException('Yêu cầu bảo trì đã bị hủy, không thể hoàn tất.');

    const result = await this.repo.completeMaintenance(id, {
      cost: dto.cost ?? null,
      performedBy: dto.performedBy ?? null,
      description: dto.description ?? null,
      condition: dto.condition ?? null,
      nextDueDate: dto.nextDueDate !== undefined ? (dto.nextDueDate ? new Date(dto.nextDueDate) : null) : null,
      markBroken: !!dto.markBroken,
    });

    if (dto.markBroken) {
      await this.notificationsService.fanoutToStaff({
        type: 'EQUIPMENT',
        title: 'Thiết bị hỏng 🚨',
        content: `${result.equipment?.name ?? ''} (${result.equipment?.code ?? ''}) tại ${result.equipment?.branch?.name ?? ''} được xác định HỎNG sau bảo trì. Lên kế hoạch sửa chữa / thay thế.`,
        link: '/admin/equipment',
        referenceType: 'EQUIPMENT_BROKEN',
        referenceId: result.equipment?.id ?? id,
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: 'MAINTENANCE_COMPLETE',
      entity: 'EquipmentMaintenance',
      entityId: id,
      metadata: {
        equipmentId: result.maintenance.equipmentId,
        equipmentCode: result.equipment?.code ?? '',
        cost: result.maintenance.cost,
        markBroken: !!dto.markBroken,
        newEquipmentStatus: result.equipment?.status ?? '',
      },
    });

    return {
      message: dto.markBroken ? 'Đã hoàn tất bảo trì. Thiết bị được đánh dấu HỎNG (BROKEN).' : 'Hoàn tất bảo trì. Thiết bị đã sẵn sàng sử dụng (AVAILABLE).',
      maintenance: result.maintenance,
      equipment: result.equipment,
    };
  }

  async cancelMaintenance(
    id: string,
    role: string,
    userBranchId?: string | null,
    actorId?: string,
  ) {
    if (!MAINTENANCE_ROLES.includes(role)) {
      throw new ForbiddenException('Bạn không có quyền hủy yêu cầu bảo trì.');
    }
    const record = await this.repo.findMaintenance(id);
    if (!record) throw new NotFoundException('Không tìm thấy yêu cầu bảo trì.');
    this.assertBranchScope(record.equipment?.branch?.id ?? '', role, userBranchId);

    if (record.status === MaintenanceStatus.COMPLETED) throw new BadRequestException('Yêu cầu bảo trì đã hoàn tất, không thể hủy.');
    if (record.status === MaintenanceStatus.CANCELLED) throw new BadRequestException('Yêu cầu bảo trì đã bị hủy trước đó.');

    const updated = await this.repo.cancelMaintenance(id);
    if (!updated) throw new NotFoundException('Không cập nhật được yêu cầu bảo trì.');

    const active = await this.repo.hasActiveMaintenance(record.equipmentId);
    if (!active) {
      const equip = await this.repo.findEquipment(record.equipmentId);
      if (equip && equip.status === EquipmentStatus.MAINTENANCE) {
        await this.repo.setEquipmentStatus(record.equipmentId, EquipmentStatus.AVAILABLE);
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
