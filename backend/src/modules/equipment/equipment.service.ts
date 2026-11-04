import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Equipment, Prisma } from '@prisma/client';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStats, EquipmentUsage } from './dto/equipment-stats.dto';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/create-maintenance.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Equipment[]> {
    return this.prisma.equipment.findMany({
      include: {
        maintenance: {
          orderBy: { createdAt: 'desc' },
        },
        checkIns: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Equipment> {
    const eq = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        maintenance: {
          orderBy: { createdAt: 'desc' },
        },
        checkIns: true,
      },
    });
    if (!eq) throw new NotFoundException('Không tìm thấy thiết bị.');
    return eq;
  }

  async create(dto: CreateEquipmentDto): Promise<Equipment> {
    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        code: dto.code,
        type: dto.type ?? 'CARDIO',
        capacity: dto.capacity,
        status: dto.status ?? 'AVAILABLE',
      },
      include: {
        maintenance: true,
      },
    });
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const data: Prisma.EquipmentUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.equipment.update({
      where: { id },
      data,
      include: {
        maintenance: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.equipment.delete({ where: { id } });
  }

  // ==================== BẢO TRÌ & SỬA CHỮA ====================

  async addMaintenance(equipmentId: string, dto: CreateMaintenanceDto) {
    const eq = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!eq) throw new NotFoundException('Không tìm thấy thiết bị.');

    const maintenance = await this.prisma.equipmentMaintenance.create({
      data: {
        equipmentId,
        status: 'IN_PROGRESS',
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        description: dto.description,
        notes: dto.notes,
      },
    });

    await this.prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'MAINTENANCE' },
    });

    return maintenance;
  }

  async updateMaintenance(
    equipmentId: string,
    maintenanceId: string,
    dto: UpdateMaintenanceDto,
  ) {
    const item = await this.prisma.equipmentMaintenance.findUnique({
      where: { id: maintenanceId },
    });
    if (!item || item.equipmentId !== equipmentId) {
      throw new NotFoundException('Không tìm thấy đợt bảo trì của thiết bị.');
    }

    const data: Prisma.EquipmentMaintenanceUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.equipmentMaintenance.update({
      where: { id: maintenanceId },
      data,
    });
  }

  async completeMaintenance(equipmentId: string, maintenanceId?: string) {
    const eq = await this.prisma.equipment.findUnique({ where: { id: equipmentId } });
    if (!eq) throw new NotFoundException('Không tìm thấy thiết bị.');

    if (maintenanceId) {
      await this.prisma.equipmentMaintenance.update({
        where: { id: maintenanceId },
        data: { status: 'COMPLETE', endDate: new Date() },
      });
    } else {
      await this.prisma.equipmentMaintenance.updateMany({
        where: { equipmentId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        data: { status: 'COMPLETE', endDate: new Date() },
      });
    }

    return this.prisma.equipment.update({
      where: { id: equipmentId },
      data: { status: 'AVAILABLE' },
      include: {
        maintenance: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  // Stats
  async getStats(): Promise<EquipmentStats[]> {
    const equipmentList = await this.prisma.equipment.findMany();
    const grouped: Record<string, { status: string; type: string; count: number }> = {};
    for (const eq of equipmentList) {
      const key = `${eq.status}|${eq.type}`;
      if (!grouped[key]) {
        grouped[key] = { status: eq.status, type: eq.type, count: 0 };
      }
      grouped[key].count++;
    }
    return Object.values(grouped) as EquipmentStats[];
  }

  // Usage
  async getUsage(): Promise<EquipmentUsage[]> {
    const checkIns = await this.prisma.checkIn.findMany({
      select: { equipmentId: true },
      where: { equipmentId: { not: null } },
    });
    const idSet = new Set(checkIns.map((c) => c.equipmentId).filter(Boolean));
    const ids = Array.from(idSet) as string[];
    if (ids.length === 0) return [];

    const equipments = await this.prisma.equipment.findMany({
      where: { id: { in: ids } },
    });

    const counts = new Map<string, number>();
    for (const id of ids) counts.set(id, 0);
    const detail = await this.prisma.checkIn.findMany({
      where: { equipmentId: { in: ids } },
      select: { equipmentId: true },
    });
    for (const d of detail) {
      if (d.equipmentId) {
        counts.set(d.equipmentId, (counts.get(d.equipmentId) ?? 0) + 1);
      }
    }

    return equipments.map((e) => ({
      equipmentId: e.id,
      name: e.name,
      type: e.type,
      usageCount: counts.get(e.id) ?? 0,
    }));
  }
}
