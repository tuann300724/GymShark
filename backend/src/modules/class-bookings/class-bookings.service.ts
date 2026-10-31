import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

/**
 * Đăng ký ca nhóm (ClassBooking).
 * - Hội viên tự đăng ký chỗ trong các buổi GROUP_CLASS có sức chứa (capacity).
 * - Chỉ mở khi: buổi SCHEDULED, chưa bắt đầu, còn chỗ, hội viên có gói hiệu lực.
 * - Hủy = xóa đăng ký, chỉ được trước khi buổi bắt đầu.
 */
@Injectable()
export class ClassBookingsService {
  constructor(private prisma: PrismaService) {}

  private async resolveMember(userId: string) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ hội viên.');
    return member;
  }

  /** Ca nhóm sắp tới đang mở đăng ký + cờ "đã đăng ký" của hội viên này */
  async listOpen(userId: string) {
    const member = await this.resolveMember(userId);
    const now = new Date();

    const sessions = await this.prisma.trainingSchedule.findMany({
      where: {
        type: 'GROUP_CLASS',
        status: 'SCHEDULED',
        capacity: { not: null },
        startTime: { gte: now },
        memberId: null,
      },
      include: {
        trainer: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
        room: { select: { id: true, name: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 50,
    });

    const mine = sessions.length
      ? await this.prisma.classBooking.findMany({
          where: { memberId: member.id, scheduleId: { in: sessions.map((s) => s.id) } },
          select: { id: true, scheduleId: true },
        })
      : [];
    const mineMap = new Map(mine.map((b) => [b.scheduleId, b.id]));

    const data = sessions.map((s) => {
      const bookedCount = s._count.bookings;
      return {
        ...s,
        bookedCount,
        slotsLeft: Math.max((s.capacity ?? 0) - bookedCount, 0),
        myBookingId: mineMap.get(s.id) ?? null,
        booked: mineMap.has(s.id),
      };
    });

    return { data, total: data.length };
  }

  /** Các ca nhóm hội viên đã đăng ký */
  async listMine(userId: string) {
    const member = await this.resolveMember(userId);
    const bookings = await this.prisma.classBooking.findMany({
      where: { memberId: member.id },
      include: {
        schedule: {
          include: {
            trainer: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
            room: { select: { id: true, name: true } },
            _count: { select: { bookings: true } },
          },
        },
      },
      orderBy: { schedule: { startTime: 'asc' } },
      take: 100,
    });
    return { data: bookings, total: bookings.length };
  }

  /** Đăng ký 1 chỗ trong ca nhóm */
  async create(userId: string, dto: CreateBookingDto) {
    const member = await this.resolveMember(userId);
    if (member.status !== 'ACTIVE') {
      throw new ForbiddenException('Tài khoản hội viên không hiệu lực.');
    }

    const now = new Date();
    const activePack = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
    });
    if (!activePack) {
      throw new BadRequestException(
        'Bạn cần có gói tập đang hiệu lực mới đăng ký được ca nhóm.',
      );
    }

    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: dto.scheduleId },
    });
    if (!session) throw new NotFoundException('Không tìm thấy ca tập.');
    if (session.type !== 'GROUP_CLASS' || !session.capacity) {
      throw new BadRequestException('Buổi tập này không mở đăng ký (chỉ ca nhóm mới nhận đăng ký).');
    }
    if (session.memberId && session.memberId !== member.id) {
      throw new BadRequestException('Đây là buổi tập riêng của hội viên khác.');
    }
    if (session.status !== 'SCHEDULED') {
      throw new BadRequestException('Ca tập này đã đóng đăng ký.');
    }
    if (session.startTime <= now) {
      throw new BadRequestException('Ca tập đã bắt đầu, không thể đăng ký.');
    }

    const bookedCount = await this.prisma.classBooking.count({
      where: { scheduleId: session.id },
    });
    if (bookedCount >= session.capacity) {
      throw new BadRequestException('Ca tập đã đủ chỗ, vui lòng chọn ca khác.');
    }

    const exists = await this.prisma.classBooking.findUnique({
      where: { scheduleId_memberId: { scheduleId: session.id, memberId: member.id } },
    });
    if (exists) throw new BadRequestException('Bạn đã đăng ký ca tập này rồi.');

    const booking = await this.prisma.classBooking.create({
      data: { scheduleId: session.id, memberId: member.id },
    });

    return {
      booking,
      bookedCount: bookedCount + 1,
      slotsLeft: Math.max(session.capacity - bookedCount - 1, 0),
    };
  }

  /** Hủy đăng ký (trước khi buổi bắt đầu) */
  async cancel(userId: string, id: string) {
    const member = await this.resolveMember(userId);
    const booking = await this.prisma.classBooking.findUnique({
      where: { id },
      include: { schedule: { select: { startTime: true } } },
    });
    if (!booking || booking.memberId !== member.id) {
      throw new NotFoundException('Không tìm thấy đăng ký của bạn.');
    }
    if (booking.schedule.startTime <= new Date()) {
      throw new BadRequestException('Ca tập đã bắt đầu, không thể hủy đăng ký.');
    }
    await this.prisma.classBooking.delete({ where: { id } });
    return { message: 'Đã hủy đăng ký ca tập.' };
  }

  /** Danh sách hội viên đã đăng ký 1 ca (HLV phụ trách / quản trị) */
  async listBySession(scheduleId: string, role: string, userId: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, trainerId: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy ca tập.');

    if (role === 'TRAINER') {
      const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
      if (!trainer || trainer.id !== session.trainerId) {
        throw new ForbiddenException('Bạn chỉ xem được đăng ký của ca mình phụ trách.');
      }
    }

    const data = await this.prisma.classBooking.findMany({
      where: { scheduleId },
      include: {
        member: {
          select: { id: true, code: true, fullName: true, phone: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { data, total: data.length };
  }
}
