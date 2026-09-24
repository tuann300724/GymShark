import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.equipment.findMany({
      include: {
        branch: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, name: true } },
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.equipment.findUnique({
      where: { id },
      include: {
        branch: true,
        room: true,
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
        },
      },
    });
  }
}
