import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBodyMetricDto } from './dto/create-body-metric.dto';

const METRIC_FIELDS = [
  'weightKg',
  'bodyFatPercent',
  'waistCm',
  'chestCm',
  'armCm',
  'thighCm',
] as const;

/**
 * Số đo cơ thể (BodyMetric) — hội viên tự ghi, tự xem biểu đồ tiến trình.
 * HLV/quản trị xem được số đo của hội viên (HLV chỉ khi còn phân công ACTIVE).
 */
@Injectable()
export class BodyMetricsService {
  constructor(private prisma: PrismaService) {}

  private async resolveMember(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ hội viên.');
    return member;
  }

  /** Ghi 1 bản ghi số đo (của chính mình) */
  async create(userId: string, dto: CreateBodyMetricDto) {
    const member = await this.resolveMember(userId);

    const hasValue = METRIC_FIELDS.some((f) => dto[f] !== undefined && dto[f] !== null);
    if (!hasValue) {
      throw new BadRequestException('Cần nhập ít nhất 1 chỉ số (cân nặng, % mỡ, vòng eo...).');
    }

    let recordedAt = new Date();
    if (dto.recordedAt) {
      recordedAt = new Date(dto.recordedAt);
      const max = new Date(Date.now() + 24 * 3600_000);
      if (isNaN(recordedAt.getTime()) || recordedAt > max) {
        throw new BadRequestException('Ngày đo không hợp lệ.');
      }
    }

    const metric = await this.prisma.bodyMetric.create({
      data: {
        memberId: member.id,
        recordedAt,
        note: dto.note?.trim() || null,
        weightKg: dto.weightKg ?? null,
        bodyFatPercent: dto.bodyFatPercent ?? null,
        waistCm: dto.waistCm ?? null,
        chestCm: dto.chestCm ?? null,
        armCm: dto.armCm ?? null,
        thighCm: dto.thighCm ?? null,
      },
    });
    return { metric };
  }

  /** Lịch sử số đo của chính mình (mới nhất trước) */
  async listMine(userId: string, limit = 120) {
    const member = await this.resolveMember(userId);
    const data = await this.prisma.bodyMetric.findMany({
      where: { memberId: member.id },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return { data, total: data.length };
  }

  /** Xóa 1 bản ghi số đo của mình */
  async remove(userId: string, id: string) {
    const member = await this.resolveMember(userId);
    const metric = await this.prisma.bodyMetric.findUnique({ where: { id } });
    if (!metric || metric.memberId !== member.id) {
      throw new NotFoundException('Không tìm thấy bản ghi số đo.');
    }
    await this.prisma.bodyMetric.delete({ where: { id } });
    return { message: 'Đã xóa bản ghi số đo.' };
  }

  /** Xem số đo của 1 hội viên (HLV phụ trách / quản trị, lễ tân) */
  async listForMember(memberId: string, role: string, userId: string, limit = 120) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, fullName: true, code: true },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');

    if (role === 'TRAINER') {
      const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
      if (!trainer) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ huấn luyện viên.');
      const assignment = await this.prisma.trainerMember.findFirst({
        where: { trainerId: trainer.id, memberId, status: 'ACTIVE' },
      });
      if (!assignment) {
        throw new ForbiddenException('Bạn chỉ xem được số đo của hội viên đang phụ trách.');
      }
    }

    const data = await this.prisma.bodyMetric.findMany({
      where: { memberId },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
    return { data, total: data.length, member };
  }
}
