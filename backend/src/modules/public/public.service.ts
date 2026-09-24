import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  /** Membership packages cho trang public (chỉ lấy gói ACTIVE) */
  async getPackages() {
    return this.prisma.membershipPackage.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { price: 'asc' },
    });
  }

  /** Huấn luyện viên đang hoạt động cho trang public */
  async getTrainers() {
    return this.prisma.trainer.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  /** Lịch lớp học công khai (các lịch KHÔNG gắn member cụ thể) */
  async getClassSchedule() {
    return this.prisma.trainingSchedule.findMany({
      where: {
        memberId: null,
        startTime: { gte: new Date() },
        status: 'SCHEDULED',
      },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        room: { select: { id: true, name: true, capacity: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });
  }

  /** Danh sách chi nhánh hoạt động (trang liên hệ) */
  async getBranches() {
    return this.prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Thống kê nhanh cho hero / giới thiệu */
  async getHomeStats() {
    const [memberCount, trainerCount, branchCount] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.trainer.count({ where: { status: 'ACTIVE' } }),
      this.prisma.branch.count({ where: { status: 'ACTIVE' } }),
    ]);
    return { totalMembers: memberCount, totalTrainers: trainerCount, totalBranches: branchCount };
  }
}