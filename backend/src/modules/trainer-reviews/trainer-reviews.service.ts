import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import {
  CreateTrainerReviewDto,
  TrainerReviewQueryDto,
  UpdateTrainerReviewDto,
} from './dto/trainer-review.dto';

@Injectable()
export class TrainerReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async resolveMember(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true, fullName: true },
    });
    if (!member)
      throw new ForbiddenException('Tài khoản này không gắn với hồ sơ hội viên.');
    return member;
  }

  private async assertTrainerActive(trainerId: string) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: trainerId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!trainer)
      throw new NotFoundException('Không tìm thấy huấn luyện viên đang hoạt động.');
    return trainer;
  }

  /** Chỉ hội viên có ít nhất 1 buổi tập đã hoàn thành với HLV được phép đánh giá. */
  private async isEligible(trainerId: string, memberId: string) {
    const completed = await this.prisma.trainingSchedule.count({
      where: {
        trainerId,
        memberId,
        OR: [{ status: 'COMPLETED' }, { completedAt: { not: null } }],
      },
    });
    return completed > 0;
  }

  /** Kiểm tra quyền đánh giá cho hội viên đang đăng nhập. */
  async eligibility(userId: string, trainerId: string) {
    const member = await this.resolveMember(userId);
    await this.assertTrainerActive(trainerId);
    const [eligible, review] = await Promise.all([
      this.isEligible(trainerId, member.id),
      this.prisma.trainerReview.findUnique({
        where: { trainerId_memberId: { trainerId, memberId: member.id } },
        select: { id: true },
      }),
    ]);
    return { eligible, reviewed: !!review };
  }

  /** Đánh giá của chính tôi về HLV (dùng để hiển thị form sửa/xoá). */
  async mine(userId: string, trainerId: string) {
    const member = await this.resolveMember(userId);
    await this.assertTrainerActive(trainerId);
    const [eligible, review] = await Promise.all([
      this.isEligible(trainerId, member.id),
      this.prisma.trainerReview.findUnique({
        where: { trainerId_memberId: { trainerId, memberId: member.id } },
        include: {
          member: { select: { fullName: true, avatarUrl: true } },
        },
      }),
    ]);
    return { eligible, review };
  }

  async create(userId: string, dto: CreateTrainerReviewDto) {
    const member = await this.resolveMember(userId);
    await this.assertTrainerActive(dto.trainerId);

    if (!(await this.isEligible(dto.trainerId, member.id))) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá huấn luyện viên sau khi đã hoàn thành buổi tập cùng HLV.',
      );
    }

    const existing = await this.prisma.trainerReview.findUnique({
      where: {
        trainerId_memberId: { trainerId: dto.trainerId, memberId: member.id },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Bạn đã đánh giá huấn luyện viên này. Hãy chỉnh sửa đánh giá cũ.',
      );
    }

    const review = await this.prisma.trainerReview.create({
      data: {
        trainerId: dto.trainerId,
        memberId: member.id,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      },
    });

    await this.syncRating(dto.trainerId);
    await this.audit.log({
      userId,
      action: 'TRAINER_REVIEW_CREATE',
      entity: 'TrainerReview',
      entityId: review.id,
      metadata: { trainerId: dto.trainerId, rating: dto.rating },
    });

    return { message: 'Đã gửi đánh giá huấn luyện viên.', review };
  }

  async update(userId: string, id: string, dto: UpdateTrainerReviewDto) {
    const member = await this.resolveMember(userId);
    const review = await this.prisma.trainerReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (review.memberId !== member.id) {
      throw new ForbiddenException('Bạn chỉ có thể sửa đánh giá của chính mình.');
    }

    const data: Prisma.TrainerReviewUpdateInput = {};
    if (dto.rating !== undefined) data.rating = dto.rating;
    if (dto.comment !== undefined) data.comment = dto.comment.trim() || null;

    const updated = await this.prisma.trainerReview.update({ where: { id }, data });
    await this.syncRating(review.trainerId);
    await this.audit.log({
      userId,
      action: 'TRAINER_REVIEW_UPDATE',
      entity: 'TrainerReview',
      entityId: id,
      metadata: { trainerId: review.trainerId, fields: Object.keys(data) },
    });

    return { message: 'Đã cập nhật đánh giá.', review: updated };
  }

  async remove(userId: string, id: string) {
    const member = await this.resolveMember(userId);
    const review = await this.prisma.trainerReview.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Không tìm thấy đánh giá.');
    if (review.memberId !== member.id) {
      throw new ForbiddenException('Bạn chỉ có thể xoá đánh giá của chính mình.');
    }

    await this.prisma.trainerReview.delete({ where: { id } });
    await this.syncRating(review.trainerId);
    await this.audit.log({
      userId,
      action: 'TRAINER_REVIEW_DELETE',
      entity: 'TrainerReview',
      entityId: id,
      metadata: { trainerId: review.trainerId },
    });

    return { message: 'Đã xoá đánh giá.' };
  }

  /** Danh sách đánh giá công khai của 1 HLV (+ điểm trung bình thực tế). */
  async listPublic(trainerId: string, query: TrainerReviewQueryDto = {}) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: trainerId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!trainer)
      throw new NotFoundException('Không tìm thấy huấn luyện viên đang hoạt động.');

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 20));

    const [rows, total, aggregate] = await Promise.all([
      this.prisma.trainerReview.findMany({
        where: { trainerId },
        include: {
          member: { select: { fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.trainerReview.count({ where: { trainerId } }),
      this.prisma.trainerReview.aggregate({
        where: { trainerId },
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

  /** Cập nhật điểm trung bình về Trainer.rating để các trang dùng chung. */
  private async syncRating(trainerId: string) {
    const aggregate = await this.prisma.trainerReview.aggregate({
      where: { trainerId },
      _avg: { rating: true },
      _count: true,
    });
    // Không reset về 5.0 khi hết đánh giá: giữ điểm nền đã có từ seed.
    if (!aggregate._count) return;
    const rating = Math.round((aggregate._avg.rating ?? 5) * 10) / 10;
    await this.prisma.trainer.update({ where: { id: trainerId }, data: { rating } });
  }
}
