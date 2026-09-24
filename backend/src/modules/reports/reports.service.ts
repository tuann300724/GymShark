import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const [
      totalMembers,
      activeMembers,
      totalTrainers,
      totalBranches,
      todayCheckIns,
      recentPayments,
    ] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { status: 'ACTIVE' } }),
      this.prisma.trainer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
      this.prisma.checkIn.count({
        where: {
          checkInTime: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      totalTrainers,
      totalBranches,
      todayCheckIns,
      totalRevenue: recentPayments._sum.amount || 0,
    };
  }

  async getRevenueTrend() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      totalTransactions: payments.length,
      data: payments,
    };
  }
}
