import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Equipment, Prisma } from '@prisma/client';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { EquipmentStats, EquipmentUsage } from './dto/equipment-stats.dto';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Equipment[]> {
    return this.prisma.equipment.findMany({
      include: { maintenance: true, checkIns: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Equipment> {
    const eq = await this.prisma.equipment.findUnique({
      where: { id },
      include: { maintenance: true, checkIns: true },
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
    });
  }

  async update(id: string, dto: UpdateEquipmentDto): Promise<Equipment> {
    const data: Prisma.EquipmentUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.capacity !== undefined) data.capacity = dto.capacity;
    if (dto.status !== undefined) data.status = dto.status;
    return this.prisma.equipment.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.equipment.delete({ where: { id } });
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
    // Get distinct equipmentIds from checkIns
    const checkIns = await this.prisma.checkIn.findMany({
      select: { equipmentId: true },
      where: { equipmentId: { not: null } },
    });
    const ids = [
      ...new Set(
        checkIns
          .map((checkIn) => checkIn.equipmentId)
          .filter((id): id is string => id !== null)
          .map((id) => id.toLowerCase()),
      ),
    ];
    if (ids.length === 0) return [];

    const equipments = await this.prisma.equipment.findMany({
      where: { id: { in: ids } },
    });

    // Count usages
    const counts = new Map<string, number>();
    for (const id of ids) counts.set(id, 0);
    const detail = await this.prisma.checkIn.findMany({
      where: { equipmentId: { in: ids } },
      select: { equipmentId: true },
    });
    for (const d of detail) {
      if (d.equipmentId) {
        const key = d.equipmentId.toLowerCase();
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return equipments.map((e) => ({
      equipmentId: e.id,
      name: e.name,
      type: e.type,
      usageCount: counts.get(e.id.toLowerCase()) ?? 0,
    }));
  }
}