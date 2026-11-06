import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { MAIL_EVENTS } from '../mail/mail.events';
import { AuditService } from '../audit-logs/audit-logs.service';

/**
 * Đăng ký ca nhóm (ClassBooking).
 * - Hội viên tự đăng ký chỗ trong các buổi GROUP_CLASS có sức chứa (capacity).
 * - Chỉ mở khi: buổi SCHEDULED, chưa bắt đầu, còn chỗ, hội viên có gói hiệu lực.
 * - Hủy = xóa đăng ký, chỉ được trước khi buổi bắt đầu.
 * - Đăng ký thành công → email xác nhận chạy nền (Nhóm B, EventEmitter).
 */
@Injectable()
export class ClassBookingsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private auditService: AuditService,
  ) {}

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
    // Lưu ý: Membership.endDate là DateTime BẮT BUỘC (không nullable) —
    // filter `endDate: null` sẽ bị PrismaClientValidationError.
    const activePack = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: 'ACTIVE',
        endDate: { gte: now },
      },
    });
    if (!activePack) {
      throw new BadRequestException(
        'Bạn cần có gói tập đang hiệu lực mới đăng ký được ca nhóm.',
      );
    }

    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: dto.scheduleId },
      // Lấy tên phòng + tên HLV để gửi email xác nhận xếp lịch
      include: {
        room: { select: { name: true } },
        trainer: { include: { user: { select: { fullName: true } } } },
      },
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

    // Email xác nhận xếp lịch (Nhóm B — nền): emit KHÔNG await, MailListener xử lý.
    // Hội viên không có email trong hồ sơ thì bỏ qua — đăng ký vẫn thành công.
    if (member.email) {
      this.eventEmitter.emit(MAIL_EVENTS.SESSION_BOOKED, {
        userId,
        email: member.email,
        fullName: member.fullName,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        roomName: session.room?.name ?? null,
        trainerName: session.trainer?.user?.fullName ?? null,
      });
    }

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

  /** Quyền thao tác: HLV chỉ được đụng tới ca nhóm của chính mình */
  private async assertCanManage(session: { trainerId: string }, role: string, userId: string) {
    if (role !== 'TRAINER') return;
    const trainer = await this.prisma.trainer.findUnique({ where: { userId } });
    if (!trainer || trainer.id !== session.trainerId) {
      throw new ForbiddenException('Bạn chỉ quản lý được ca nhóm của chính mình.');
    }
  }

  /**
   * [HLV/QTV] Gán nhiều hội viên vào 1 ca nhóm cùng lúc (tạo ClassBooking).
   * Validate: ca GROUP_CLASS còn sức chứa, hội viên ACTIVE + có gói hiệu lực,
   * chưa book, không trùng lịch PT/ca nhóm khác cùng khung giờ.
   * Thành công → notification in-app + email xác nhận (chạy nền).
   */
  async addMembers(scheduleId: string, memberIds: string[], role: string, userId: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        room: { select: { name: true } },
        trainer: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (!session) throw new NotFoundException('Không tìm thấy ca tập.');
    if (session.type !== 'GROUP_CLASS' || !session.capacity) {
      throw new BadRequestException('Chỉ ca nhóm có sức chứa mới gán được hội viên.');
    }
    if (session.status !== 'SCHEDULED') {
      throw new BadRequestException('Ca tập đã đóng, không thể gán hội viên.');
    }
    if (session.startTime <= new Date()) {
      throw new BadRequestException('Ca tập đã bắt đầu, không thể gán hội viên.');
    }
    await this.assertCanManage(session, role, userId);

    // Loại trùng trong request + loại người đã có trong ca
    const uniqueIds = [...new Set(memberIds)];
    const already = await this.prisma.classBooking.findMany({
      where: { scheduleId, memberId: { in: uniqueIds } },
      select: { memberId: true },
    });
    const alreadySet = new Set(already.map((b) => b.memberId));
    const toAdd = uniqueIds.filter((id) => !alreadySet.has(id));
    if (toAdd.length === 0) {
      throw new BadRequestException('Những hội viên này đã có trong ca tập.');
    }

    const bookedCount = await this.prisma.classBooking.count({ where: { scheduleId } });
    const slotsLeft = session.capacity - bookedCount;
    if (toAdd.length > slotsLeft) {
      throw new BadRequestException(
        `Ca tập chỉ còn ${slotsLeft} chỗ, bạn chọn ${toAdd.length} hội viên.`,
      );
    }

    // Hội viên: tồn tại + đang hiệu lực
    const members = await this.prisma.member.findMany({
      where: { id: { in: toAdd } },
      select: { id: true, code: true, fullName: true, email: true, status: true, userId: true },
    });
    const foundIds = new Set(members.map((m) => m.id));
    const missing = toAdd.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new BadRequestException(`${missing.length} hội viên không tồn tại trong hệ thống.`);
    }
    const inactive = members.filter((m) => m.status !== 'ACTIVE');
    if (inactive.length) {
      throw new BadRequestException(
        `Hội viên không hiệu lực: ${inactive.map((m) => `${m.fullName} (${m.code})`).join(', ')}.`,
      );
    }

    // Gói tập đang hiệu lực
    const now = new Date();
    const packs = await this.prisma.membership.findMany({
      where: { memberId: { in: toAdd }, status: 'ACTIVE', endDate: { gte: now } },
      select: { memberId: true },
    });
    const packIds = new Set(packs.map((p) => p.memberId));
    const noPack = members.filter((m) => !packIds.has(m.id));
    if (noPack.length) {
      throw new BadRequestException(
        `Chưa có gói tập hiệu lực: ${noPack.map((m) => `${m.fullName} (${m.code})`).join(', ')}.`,
      );
    }

    // Trùng lịch: buổi PT riêng hoặc ca nhóm khác cùng khung giờ
    const clashTitles = new Map<string, string[]>();
    const ptClash = await this.prisma.trainingSchedule.findMany({
      where: {
        memberId: { in: toAdd },
        id: { not: scheduleId },
        status: 'SCHEDULED',
        startTime: { lt: session.endTime },
        endTime: { gt: session.startTime },
      },
      select: { memberId: true, title: true },
    });
    ptClash.forEach((c) => {
      if (!c.memberId) return;
      clashTitles.set(c.memberId, [...(clashTitles.get(c.memberId) || []), c.title]);
    });
    const bkClash = await this.prisma.classBooking.findMany({
      where: {
        memberId: { in: toAdd },
        scheduleId: { not: scheduleId },
        schedule: {
          status: 'SCHEDULED',
          startTime: { lt: session.endTime },
          endTime: { gt: session.startTime },
        },
      },
      select: { memberId: true, schedule: { select: { title: true } } },
    });
    bkClash.forEach((c) => {
      clashTitles.set(c.memberId, [...(clashTitles.get(c.memberId) || []), c.schedule.title]);
    });
    if (clashTitles.size) {
      const lines = members
        .filter((m) => clashTitles.has(m.id))
        .map((m) => {
          const titles = [...new Set(clashTitles.get(m.id)!)];
          return `${m.fullName} (${m.code}) đã có lịch "${titles.join('", "')}" trùng giờ`;
        });
      throw new BadRequestException(`${lines.join('; ')}.`);
    }

    // Đã validate "chưa có trong ca" ở trên — bỏ qua skipDuplicates (Prisma không hỗ trợ trên SQL Server)
    await this.prisma.classBooking.createMany({
      data: toAdd.map((memberId) => ({ scheduleId, memberId })),
    });

    // Notification in-app + email xác nhận (chạy nền, không await)
    for (const m of members) {
      await this.prisma.notification.create({
        data: {
          memberId: m.id,
          title: 'Bạn được gán vào ca nhóm 📅',
          content: `${session.title} lúc ${session.startTime.toLocaleString('vi-VN')}${session.room?.name ? ` · ${session.room.name}` : ''}.`,
          type: 'SCHEDULE',
          link: '/member/schedule',
        },
      });
      if (m.userId && m.email) {
        this.eventEmitter.emit(MAIL_EVENTS.SESSION_BOOKED, {
          userId: m.userId,
          email: m.email,
          fullName: m.fullName,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          roomName: session.room?.name ?? null,
          trainerName: session.trainer?.user?.fullName ?? null,
        });
      }
    }

    await this.auditService.log({
      userId,
      action: 'SCHEDULE_UPDATE',
      entity: 'TrainingSchedule',
      entityId: scheduleId,
      metadata: { change: 'ADD_CLASS_MEMBERS', added: toAdd.length, memberIds: toAdd },
    });

    const newBooked = bookedCount + toAdd.length;
    return {
      added: toAdd.length,
      skipped: already.length,
      bookedCount: newBooked,
      slotsLeft: Math.max(session.capacity - newBooked, 0),
    };
  }

  /** [HLV/QTV] Bỏ 1 hội viên khỏi ca nhóm (hủy đăng ký trước khi buổi bắt đầu) */
  async removeMember(scheduleId: string, memberId: string, role: string, userId: string) {
    const session = await this.prisma.trainingSchedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, trainerId: true, status: true, startTime: true },
    });
    if (!session) throw new NotFoundException('Không tìm thấy ca tập.');
    await this.assertCanManage(session, role, userId);
    if (session.status !== 'SCHEDULED') {
      throw new BadRequestException('Ca tập đã đóng, không thể hủy đăng ký.');
    }
    if (session.startTime <= new Date()) {
      throw new BadRequestException('Ca tập đã bắt đầu, không thể hủy đăng ký.');
    }
    const booking = await this.prisma.classBooking.findUnique({
      where: { scheduleId_memberId: { scheduleId, memberId } },
    });
    if (!booking) throw new NotFoundException('Hội viên này không có trong ca tập.');

    await this.prisma.classBooking.delete({ where: { id: booking.id } });
    await this.auditService.log({
      userId,
      action: 'SCHEDULE_UPDATE',
      entity: 'TrainingSchedule',
      entityId: scheduleId,
      metadata: { change: 'REMOVE_CLASS_MEMBER', memberId },
    });
    return { message: 'Đã bỏ hội viên khỏi ca nhóm.' };
  }
}
