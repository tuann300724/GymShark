import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.trainingSchedule.findMany({
      include: {
        trainer: { include: { user: { select: { fullName: true, phone: true } } } },
        member: { select: { id: true, code: true, fullName: true, phone: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.trainingSchedule.findUnique({
      where: { id },
      include: {
        trainer: { include: { user: true } },
        member: true,
        room: true,
      },
    });
  }
}
