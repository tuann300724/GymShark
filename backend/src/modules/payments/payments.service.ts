import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.payment.findMany({
      include: {
        member: { select: { id: true, code: true, fullName: true, phone: true } },
        membership: {
          include: { package: { select: { id: true, name: true } } },
        },
        promotion: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        member: true,
        membership: { include: { package: true } },
        promotion: true,
      },
    });
  }
}
