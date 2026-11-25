import { Injectable, NotFoundException } from "@nestjs/common";
import { PackageType } from "../../common/constants/db-enums";
import { PrismaService } from "../../prisma/prisma.service";
import { parseJsonText } from "../../common/utils/json-text";

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  /** Membership packages cho trang public (chỉ lấy gói ACTIVE) */
  async getPackages() {
    const packages = await this.prisma.membershipPackage.findMany({
      where: { status: "ACTIVE", type: { not: PackageType.SESSION_BASED } },
      orderBy: { price: "asc" },
    });
    return packages.map((pkg) => ({
      ...pkg,
      features: parseJsonText<{ title?: string; items: string[] }>(
        pkg.features,
      ),
    }));
  }

  /** Chi nhánh công khai có thể được hội viên chọn khi đăng ký gói tập. */
  async getBranches() {
    return this.prisma.partnerBranch.findMany({
      where: {
        status: "ACTIVE",
        partner: { is: { status: "APPROVED" } },
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        partner: { select: { businessName: true } },
      },
      orderBy: [{ partner: { businessName: "asc" } }, { name: "asc" }],
    });
  }

  /** Huấn luyện viên đang hoạt động cho trang public */
  async getTrainers() {
    return this.prisma.trainer.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { rating: "desc" },
    });
  }

  /**
   * Hồ sơ 1 huấn luyện viên cho trang public.
   * Chỉ trả các trường có thể hiển thị công khai — không email, SĐT hay danh sách học viên.
   */
  async getTrainer(id: string) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id, status: "ACTIVE" },
      select: {
        id: true,
        specialization: true,
        certification: true,
        experienceYears: true,
        bio: true,
        rating: true,
        hourlyRate: true,
        gender: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");

    const [upcomingSessions, activeMembers, reviewCount] = await Promise.all([
      this.prisma.trainingSchedule.count({
        where: {
          trainerId: id,
          status: "SCHEDULED",
          startTime: { gte: new Date() },
        },
      }),
      this.prisma.trainerMember.count({
        where: { trainerId: id, status: "ACTIVE" },
      }),
      this.prisma.trainerReview.count({ where: { trainerId: id } }),
    ]);

    return {
      ...trainer,
      reviewCount,
      stats: { upcomingSessions, activeMembers },
    };
  }

  /** Đánh giá công khai của 1 HLV (trang hồ sơ) */
  async getTrainerReviews(
    id: string,
    query: { page?: number; limit?: number } = {},
  ) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));

    const [rows, total, aggregate] = await Promise.all([
      this.prisma.trainerReview.findMany({
        where: { trainerId: id },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          member: { select: { fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trainerReview.count({ where: { trainerId: id } }),
      this.prisma.trainerReview.aggregate({
        where: { trainerId: id },
        _avg: { rating: true },
      }),
    ]);

    return {
      data: rows,
      total,
      page,
      limit,
      averageRating: aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
    };
  }

  /** Lịch lớp học công khai (các lịch KHÔNG gắn member cụ thể) */
  async getClassSchedule() {
    return this.prisma.trainingSchedule.findMany({
      where: {
        memberId: null,
        startTime: { gte: new Date() },
        status: "SCHEDULED",
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
      orderBy: { startTime: "asc" },
      take: 50,
    });
  }

  /** Thống kê nhanh cho hero / giới thiệu */
  async getHomeStats() {
    const [memberCount, trainerCount] = await Promise.all([
      this.prisma.member.count(),
      this.prisma.trainer.count({ where: { status: "ACTIVE" } }),
    ]);
    return { totalMembers: memberCount, totalTrainers: trainerCount };
  }
}
