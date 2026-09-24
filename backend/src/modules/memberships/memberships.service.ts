import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.membership.findMany({
      include: {
        member: { select: { id: true, code: true, fullName: true, phone: true } },
        package: { select: { id: true, name: true, durationDays: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: true,
        package: true,
        payments: true,
      },
    });
  }
}
