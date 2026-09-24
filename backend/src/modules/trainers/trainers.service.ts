import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.trainer.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.trainer.findUnique({
      where: { id },
      include: {
        user: true,
        schedules: {
          include: { member: true, room: true },
          orderBy: { startTime: 'desc' },
          take: 20,
        },
      },
    });
  }
}
