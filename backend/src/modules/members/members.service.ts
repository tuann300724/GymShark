import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.member.findMany({
      include: {
        branch: { select: { id: true, name: true, code: true } },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { package: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.member.findUnique({
      where: { id },
      include: {
        branch: true,
        memberships: {
          include: { package: true },
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        checkIns: {
          orderBy: { checkInTime: 'desc' },
          take: 15,
        },
        schedules: {
          include: { trainer: { include: { user: true } }, room: true },
          orderBy: { startTime: 'desc' },
          take: 10,
        },
      },
    });
  }
}
