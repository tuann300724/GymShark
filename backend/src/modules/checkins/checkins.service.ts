import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CheckInMethod } from '../../common/constants/db-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { FacesService } from '../faces/faces.service';
import { FaceCheckInDto, FaceScanDto, QrCheckInDto } from './dto/checkin.dto';
import { MemberQrService } from '../../common/services/member-qr.service';

interface CheckInMember {
  id: string;
  status: string;
  fullName?: string;
}

@Injectable()
export class CheckinsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private facesService: FacesService,
    private qrService: MemberQrService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Map user đang đăng nhập → hồ sơ Member (không tin memberId từ client) */
  private async resolveMemberByUserId(userId: string) {
    if (!userId) throw new ForbiddenException('Không xác định được tài khoản đăng nhập');
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException('Tài khoản này không gắn với hồ sơ hội viên.');
    }
    return member;
  }

  /** Đóng các thẻ ACTIVE đã hết hạn (chạy nền, không phá dữ liệu) */
  private async syncExpiredMemberships(memberId: string) {
    await this.prisma.membership.updateMany({
      where: { memberId, status: 'ACTIVE', endDate: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  /** Lấy membership đang ACTIVE, còn hiệu lực trong ngày hôm nay (startDate <= now <= endDate) */
  private async getActiveMembership(memberId: string) {
    await this.syncExpiredMemberships(memberId);
    const now = new Date();
    return this.prisma.membership.findFirst({
      where: {
        memberId,
        status: 'ACTIVE',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        package: { select: { id: true, name: true } },
      },
      orderBy: { endDate: 'desc' },
    });
  }

  /**
   * Kiểm tra toàn bộ điều kiện check-in (backend tự quyết, KHÔNG tin frontend):
   * 1) Member tồn tại   2) Account ACTIVE   3) Có membership   4) Membership ACTIVE
   * 5) startDate <= today <= endDate        6) Không có phiên CHECKED_IN đang mở
   * Trả về membership hợp lệ để response bổ sung thông tin.
   */
  private async validateMemberForCheckIn(member: CheckInMember) {
    // Điều kiện 2: tài khoản hội viên phải ACTIVE
    if (member.status !== 'ACTIVE') {
      const message =
        member.status === 'SUSPENDED'
          ? 'Tài khoản của bạn đang bị tạm khóa.'
          : `Tài khoản hội viên đang ở trạng thái ${member.status}.`;
      throw new BadRequestException(message);
    }

    // Điều kiện 3 + 4 + 5: phải có membership ACTIVE còn hiệu lực hôm nay
    const membership = await this.getActiveMembership(member.id);
    if (!membership) {
      const anyMembership = await this.prisma.membership.findFirst({
        where: { memberId: member.id },
        orderBy: { endDate: 'desc' },
      });
      if (anyMembership) {
        throw new BadRequestException(
          'Gói tập của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục check-in.',
        );
      }
      throw new BadRequestException('Bạn chưa có gói tập đang hoạt động.');
    }

    // Điều kiện 6: không được có attendance đang CHECKED_IN
    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: 'CHECKED_IN' },
    });
    if (active) {
      throw new BadRequestException('Bạn đang trong phòng gym.');
    }

    return membership;
  }

  private static memberSelect = {
    id: true,
    code: true,
    fullName: true,
    phone: true,
    avatarUrl: true,
  } satisfies Prisma.MemberSelect;

  private computeDurationMinutes(checkInTime: Date, checkOutTime?: Date | null): number | null {
    if (!checkOutTime) return null;
    return Math.max(1, Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000));
  }

  // ---------------------------------------------------------------------------
  // Member tự check-in / check-out
  // ---------------------------------------------------------------------------

  /** POST /checkins — member tự check-in (lấy member từ JWT) */
  async checkIn(userId: string, method?: CheckInMethod) {
    const member = await this.resolveMemberByUserId(userId);
    const membership = await this.validateMemberForCheckIn(member);

    const checkIn = await this.prisma.checkIn.create({
      data: {
        memberId: member.id,
        checkInTime: new Date(),
        status: 'CHECKED_IN',
        method: method ?? CheckInMethod.MANUAL,
      },
    });

    // Thông báo check-in thành công (STEP 8)
    await this.prisma.notification.create({
      data: {
        memberId: member.id,
        title: 'Check-in thành công 💪',
        content: `Bạn đã check-in lúc ${checkIn.checkInTime.toLocaleTimeString('vi-VN')}.`,
        type: 'CHECKIN',
        link: '/member/checkins',
        referenceType: 'CHECKIN',
        referenceId: checkIn.id,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CHECK_IN',
      entity: 'CheckIn',
      entityId: checkIn.id,
      metadata: { method: checkIn.method, memberCode: member.code },
    });

    return {
      success: true,
      message: 'Check-in thành công',
      data: {
        id: checkIn.id,
        checkInAt: checkIn.checkInTime,
        status: checkIn.status,
        method: checkIn.method,
        member: {
          id: member.id,
          code: member.code,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
        },
        membership: membership
          ? { id: membership.id, packageName: membership.package?.name ?? null }
          : null,
      },
    };
  }

  /** POST /checkins/checkout — member tự check-out */
  async checkOut(userId: string) {
    const member = await this.resolveMemberByUserId(userId);

    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: 'CHECKED_IN' },
    });
    if (!active) {
      throw new BadRequestException('Không tìm thấy phiên tập đang hoạt động.');
    }

    const checkOutAt = new Date();
    const updated = await this.prisma.checkIn.update({
      where: { id: active.id },
      data: { checkOutTime: checkOutAt, status: 'CHECKED_OUT' },
    });

    // Thông báo check-out thành công (STEP 8)
    await this.prisma.notification.create({
      data: {
        memberId: member.id,
        title: 'Check-out thành công 👋',
        content: `Buổi tập kết thúc lúc ${checkOutAt.toLocaleTimeString('vi-VN')}. Hẹn gặp lại bạn!`,
        type: 'CHECKIN',
        link: '/member/checkins',
        referenceType: 'CHECKOUT',
        referenceId: updated.id,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CHECK_OUT',
      entity: 'CheckIn',
      entityId: updated.id,
      metadata: { memberCode: member.code },
    });

    return {
      success: true,
      message: 'Check-out thành công',
      data: {
        id: updated.id,
        checkInAt: updated.checkInTime,
        checkOutAt,
        status: updated.status,
        durationMinutes: this.computeDurationMinutes(updated.checkInTime, checkOutAt),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Face check-in — quét nhận diện khuôn mặt (sinh trắc học)
  // ---------------------------------------------------------------------------

  /**
   * POST /checkins/face — hội viên tự quét khuôn mặt (1:1).
   * Bước 1: FacesService so vector với mẫu đã đăng ký của CHÍNH hội viên (cosine).
   * Bước 2: nếu khớp → gọi lại pipeline checkIn() chuẩn (validate thẻ tập,
   *          notification, audit) với method FACE_ID — không viết lại validate.
   */
  async faceCheckIn(userId: string, dto: FaceCheckInDto) {
    const member = await this.resolveMemberByUserId(userId);
    const match = await this.facesService.matchForMember(member.id, dto.embedding);
    if (!match) {
      throw new BadRequestException(
        'Khuôn mặt không khớp với hồ sơ đăng ký. Vui lòng thử lại (đảm bảo đủ ánh sáng) hoặc đăng ký lại khuôn mặt.',
      );
    }

    const result = await this.checkIn(userId, CheckInMethod.FACE_ID);
    return {
      ...result,
      face: { similarity: Number(match.similarity.toFixed(4)) },
    };
  }

  /**
   * POST /checkins/face-scan — lễ tân quét 1:N tại quầy.
   * Server tự nhận diện (không tin memberId từ client) rồi chạy pipeline staffCheckIn.
   */
  /**
   * POST /checkins/face-checkout — lễ tân quét 1:N để check-out (tự tìm hội viên rồi đóng phiên đang mở)
   */
  async faceCheckOut(dto: FaceScanDto, role = 'STAFF', actorId?: string) {
    const match = await this.facesService.matchGlobal(dto.embedding);
    if (!match) {
      throw new NotFoundException('Không nhận diện được hội viên nào.');
    }
    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: match.memberId, status: 'CHECKED_IN' },
    });
    if (!active) {
      throw new BadRequestException('Hội viên chưa check-in (không có phiên tập đang mở).');
    }
    const updated = await this.prisma.checkIn.update({
      where: { id: active.id },
      data: { checkOutTime: new Date(), status: 'CHECKED_OUT' },
    });
    await this.prisma.notification.create({
      data: {
        memberId: active.memberId,
        title: 'Check-out thành công 👋',
        content: `Bạn đã kết thúc buổi tập lúc ${updated.checkOutTime!.toLocaleTimeString('vi-VN')}.`,
        type: 'CHECKIN',
        link: '/member/checkins',
        referenceType: 'CHECKOUT',
        referenceId: updated.id,
      },
    });
    await this.auditService.log({
      userId: actorId,
      action: 'CHECK_OUT',
      entity: 'CheckIn',
      entityId: updated.id,
      metadata: { method: CheckInMethod.FACE_ID, memberCode: match.memberCode ?? '', via: 'staff-face-checkout' },
    });
    return {
      success: true,
      message: 'Check-out thành công',
      data: {
        id: updated.id,
        checkInTime: updated.checkInTime,
        checkOutTime: updated.checkOutTime,
        status: updated.status,
        member: {
          id: active.memberId,
          code: match.memberCode ?? (await this.prisma.member.findUnique({ where: { id: match.memberId }, select: { code: true } }))?.code ?? '',
          fullName: (await this.prisma.member.findUnique({ where: { id: match.memberId }, select: { fullName: true } }))?.fullName ?? '',
        },
      },
      face: { similarity: Number(match.similarity.toFixed(4)), imageData: match.imageData },
    };
  }

  async faceScanForStaff(dto: FaceScanDto, role: string, actorId?: string) {
    const match = await this.facesService.matchGlobal(dto.embedding);
    if (!match) {
      throw new NotFoundException(
        'Không nhận diện được hội viên nào. Vui lòng thử lại hoặc check-in thủ công.',
      );
    }

    const result = await this.staffCheckIn(
      {
        memberId: match.memberId,
        method: CheckInMethod.FACE_ID,
        note: `Quét khuôn mặt — độ khớp ${(match.similarity * 100).toFixed(1)}%`,
      },
      role,
      actorId,
    );
    return {
      ...result,
      face: { similarity: Number(match.similarity.toFixed(4)), imageData: match.imageData },
    };
  }

  // ---------------------------------------------------------------------------
  // Member: trạng thái hiện tại & lịch sử
  // ---------------------------------------------------------------------------

  /** GET /checkins/me/current — member đang trong phòng hay không */
  async getCurrent(userId: string) {
    const member = await this.resolveMemberByUserId(userId);
    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: 'CHECKED_IN' },
    });
    if (!active) {
      return { checkedIn: false };
    }
    return {
      checkedIn: true,
      checkInAt: active.checkInTime,
      sinceMinutes: this.computeDurationMinutes(active.checkInTime, new Date()),
      checkInId: active.id,
    };
  }

  /** GET /checkins/me/history — lịch sử cá nhân + statistics */
  async getMyHistory(userId: string, query: MyHistoryQuery = {}) {
    const member = await this.resolveMemberByUserId(userId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = { memberId: member.id };

    if (query.month) {
      const [y, m] = query.month.split('-').map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.checkInTime = { gte: start, lt: end };
    } else if (query.fromDate || query.toDate) {
      const from = query.fromDate
        ? this.startOfDay(new Date(query.fromDate))
        : undefined;
      const to = query.toDate ? this.endOfDay(new Date(query.toDate)) : undefined;
      where.checkInTime = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        orderBy: { checkInTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    // Statistics: tổng / tháng / tuần / thời gian tập trung bình
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    const day = (startOfWeek.getDay() + 6) % 7; // Thứ 2 = 0
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const [month, week] = await Promise.all([
      this.prisma.checkIn.count({
        where: { memberId: member.id, checkInTime: { gte: startOfMonth } },
      }),
      this.prisma.checkIn.count({
        where: { memberId: member.id, checkInTime: { gte: startOfWeek } },
      }),
    ]);

    // Average duration (chỉ tính các phiên đã check-out)
    const doneRows = await this.prisma.checkIn.findMany({
      where: { memberId: member.id, checkOutTime: { not: null } },
      select: { checkInTime: true, checkOutTime: true },
    });
    let avgDuration = 0;
    if (doneRows.length > 0) {
      const totalMinutes = doneRows.reduce(
        (sum, r) =>
          sum +
          Math.max(1, Math.round((r.checkOutTime!.getTime() - r.checkInTime.getTime()) / 60000)),
        0,
      );
      avgDuration = Math.round(totalMinutes / doneRows.length);
    }

    return {
      data: await Promise.all(
        data.map((c) => this.toHistoryRow(c)),
      ),
      total,
      page,
      limit,
      stats: { total, month, week, avgDuration },
    };
  }

  private async toHistoryRow(c: any) {
    return {
      id: c.id,
      checkInTime: c.checkInTime,
      checkOutTime: c.checkOutTime,
      status: c.status,
      method: c.method,
      durationMinutes: this.computeDurationMinutes(c.checkInTime, c.checkOutTime),
    };
  }

  // ---------------------------------------------------------------------------
  // Staff / Admin thao tác cho người khác
  // ---------------------------------------------------------------------------

  /** POST /checkins/staff — lễ tân check-in hội viên theo memberId (không tin member) */
  async staffCheckIn(dto: StaffCheckInInput, role = 'STAFF', actorId?: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');

    const membership = await this.validateMemberForCheckIn(member);

    const checkIn = await this.prisma.checkIn.create({
      data: {
        memberId: member.id,
        checkInTime: new Date(),
        status: 'CHECKED_IN',
        method: dto.method ?? CheckInMethod.STAFF,
        notes: dto.note ?? null,
      },
    });

    // Thông báo check-in bởi lễ tân (STEP 8)
    await this.prisma.notification.create({
      data: {
        memberId: member.id,
        title: 'Check-in thành công 💪',
        content: `Lễ tân đã check-in cho bạn lúc ${checkIn.checkInTime.toLocaleTimeString('vi-VN')}.`,
        type: 'CHECKIN',
        link: '/member/checkins',
        referenceType: 'CHECKIN_STAFF',
        referenceId: checkIn.id,
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'CHECK_IN',
      entity: 'CheckIn',
      entityId: checkIn.id,
      metadata: { method: checkIn.method, memberCode: member.code, via: 'staff' },
    });

    return {
      success: true,
      message: 'Check-in thành công',
      data: {
        id: checkIn.id,
        checkInAt: checkIn.checkInTime,
        status: checkIn.status,
        method: checkIn.method,
        member: {
          id: member.id,
          code: member.code,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
        },
        membership: membership
          ? { id: membership.id, packageName: membership.package?.name ?? null }
          : null,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Check-in bằng mã QR hội viên
  // ---------------------------------------------------------------------------

  /**
   * GET /checkins/qr/lookup — lễ tân nhập/dán mã QR để đối chiếu hội viên
   * trước khi bấm check-in. Trả về hồ sơ + thẻ tập + trạng thái phiên tập hiện tại.
   */
  async lookupByQr(token: string) {
    const payload = this.qrService.verify(token);
    if (!payload) throw new BadRequestException('Mã QR không hợp lệ hoặc đã bị chỉnh sửa.');

    const member = await this.prisma.member.findUnique({
      where: { id: payload.memberId },
      include: {
        user: { select: { id: true, avatarUrl: true } },
      },
    });

    // Mã thẻ ghi trong token phải khớp thẻ thật — nếu không thì QR cũ/đã bị cắt ghép
    if (!member || member.code !== payload.memberCode) {
      throw new NotFoundException('Không tìm thấy hội viên theo mã QR này.');
    }

    const current = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: 'CHECKED_IN' },
      orderBy: { checkInTime: 'desc' },
    });

    const membership = await this.getActiveMembership(member.id);

    return {
      member: {
        id: member.id,
        code: member.code,
        fullName: member.fullName,
        phone: member.phone,
        email: member.email,
        avatarUrl: member.avatarUrl ?? member.user?.avatarUrl ?? null,
        status: member.status,
      },
      checkedIn: !!current,
      currentCheckIn: current ? { id: current.id, checkInAt: current.checkInTime } : null,
      membership: membership
        ? {
            id: membership.id,
            packageName: membership.package?.name ?? null,
            endDate: membership.endDate,
            remainingDays: Math.max(
              0,
              Math.ceil((new Date(membership.endDate).getTime() - Date.now()) / 86_400_000),
            ),
          }
        : null,
    };
  }

  /**
   * POST /checkins/qr — lễ tân quét/nhập mã QR rồi check-in cho hội viên.
   * Mã QR chỉ là cách *tìm ra* memberId; toàn bộ kiểm tra thẻ tập và quyền hạn
   * vẫn đi qua `staffCheckIn` như check-in tay, không có đường tắt.
   */
  async checkInByQr(dto: QrCheckInDto, role = 'STAFF', actorId?: string) {
    const payload = this.qrService.verify(dto.token);
    if (!payload) throw new BadRequestException('Mã QR không hợp lệ hoặc đã bị chỉnh sửa.');

    return this.staffCheckIn(
      {
        memberId: payload.memberId,
        note: dto.note,
        method: CheckInMethod.QR_CODE,
      },
      role,
      actorId,
    );
  }

  /** POST /checkins/:id/checkout — admin/staff check-out giúp member */
  async checkoutById(id: string, actorId?: string) {
    const record = await this.prisma.checkIn.findUnique({ where: { id } });
    if (!record) throw new NotFoundException('Không tìm thấy phiên check-in.');

    if (record.status === 'CHECKED_OUT') {
      throw new BadRequestException('Phiên tập này đã kết thúc (đã check-out).');
    }

    const checkOutAt = new Date();
    const updated = await this.prisma.checkIn.update({
      where: { id },
      data: { checkOutTime: checkOutAt, status: 'CHECKED_OUT' },
      include: {
        member: { select: CheckinsService.memberSelect },
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: 'CHECK_OUT',
      entity: 'CheckIn',
      entityId: updated.id,
      metadata: { memberCode: updated.member?.code ?? null, via: 'staff' },
    });

    return {
      success: true,
      message: 'Check-out thành công',
      data: {
        id: updated.id,
        member: updated.member,
        checkInAt: updated.checkInTime,
        checkOutAt,
        status: updated.status,
        durationMinutes: this.computeDurationMinutes(updated.checkInTime, checkOutAt),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin / Staff: danh sách & hiện đang trong phòng
  // ---------------------------------------------------------------------------

  /** GET /checkins — lịch sử toàn hệ thống (search / filter / sort / pagination) */
  async findAll(query: GetCheckinsQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = {};

    if (query.status) where.status = query.status as any;

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        where.member = {
          OR: [
            { fullName: { contains: term } },
            { code: { contains: term } },
            { phone: { contains: term } },
          ],
        };
      }
    }

    if (query.fromDate || query.toDate) {
      const from = query.fromDate ? this.startOfDay(new Date(query.fromDate)) : undefined;
      const to = query.toDate ? this.endOfDay(new Date(query.toDate)) : undefined;
      where.checkInTime = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const sortBy = ['checkInTime', 'checkOutTime', 'createdAt'].includes(query.sortBy!)
      ? query.sortBy!
      : 'checkInTime';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        include: {
          member: { select: CheckinsService.memberSelect },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        id: c.id,
        memberId: c.memberId,
        checkInTime: c.checkInTime,
        checkOutTime: c.checkOutTime,
        status: c.status,
        method: c.method,
        notes: c.notes,
        durationMinutes: this.computeDurationMinutes(c.checkInTime, c.checkOutTime),
        member: c.member,
      })),
      total,
      page,
      limit,
    };
  }

  /** GET /checkins/currently-inside — danh sách hội viên đang có mặt trong phòng */
  async currentlyInside() {
    const rows = await this.prisma.checkIn.findMany({
      where: { status: 'CHECKED_IN' },
      include: {
        member: {
          select: {
            ...CheckinsService.memberSelect,
            memberships: {
              where: { status: 'ACTIVE' },
              include: { package: { select: { id: true, name: true } } },
              orderBy: { endDate: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { checkInTime: 'asc' },
    });

    const now = new Date();
    return rows.map((c) => ({
      id: c.id,
      memberId: c.memberId,
      member: c.member,
      packageName: c.member.memberships[0]?.package?.name ?? null,
      checkInTime: c.checkInTime,
      durationMinutes: this.computeDurationMinutes(c.checkInTime, now),
      method: c.method,
    }));
  }

  // ---------------------------------------------------------------------------
  // Helpers thời gian
  // ---------------------------------------------------------------------------

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }
}

// ---------------------------------------------------------------------------
// Types (không muốn tạo file types riêng để giữ module gọn)
// ---------------------------------------------------------------------------

export interface MyHistoryQuery {
  page?: number | string;
  limit?: number | string;
  month?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetCheckinsQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface StaffCheckInInput {
  memberId: string;
  method?: CheckInMethod;
  note?: string;
}