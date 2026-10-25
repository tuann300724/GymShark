import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../common/constants/db-enums';
import { parseJsonText, serializeJsonText } from '../../common/utils/json-text';
import { PrismaService } from '../../prisma/prisma.service';

export type NotificationTarget = 'ALL' | 'MEMBERS' | 'TRAINERS' | 'STAFF' | 'MANAGERS' | 'ADMIN';

/** Các loại thông báo (STEP 8) — lưu dạng string trong cột type */
export const NOTIFICATION_TYPES = [
  'PAYMENT',
  'MEMBERSHIP',
  'CHECKIN',
  'TRAINING',
  'PROMOTION',
  'SYSTEM',
  'CHAT',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  userId?: string;
  memberId?: string;
  type: NotificationType;
  title: string;
  content: string;
  link?: string;
  data?: Prisma.InputJsonValue;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private withParsedData<T extends { data: string | null }>(notification: T) {
    return { ...notification, data: parseJsonText<unknown>(notification.data) };
  }

  // ---------------------------------------------------------------------------
  // Tạo thông báo với chống trùng lặp (referenceType + referenceId + người nhận)
  // ---------------------------------------------------------------------------

  /**
   * Tạo 1 thông báo. Nếu có referenceType/referenceId và đã tồn tại thông báo
   * cùng cặp ref + cùng người nhận → bỏ qua (không spam cùng sự kiện).
   */
  async create(input: CreateNotificationInput): Promise<void> {
    const where: Prisma.NotificationWhereInput = {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.memberId ? { memberId: input.memberId } : {}),
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    };

    if (input.referenceType && input.referenceId) {
      const dup = await this.prisma.notification.findFirst({ where });
      if (dup) return;
    }

    await this.prisma.notification.create({
      data: {
        userId: input.userId ?? null,
        memberId: input.memberId ?? null,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
        data: serializeJsonText(input.data),
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  /** Tạo thông báo trong transaction hiện có (dùng cho flow register/confirm...) */
  createTx(tx: Prisma.TransactionClient, input: CreateNotificationInput) {
    return tx.notification.create({
      data: {
        userId: input.userId ?? null,
        memberId: input.memberId ?? null,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
        data: serializeJsonText(input.data),
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Broadcast (thông báo hệ thống / announcement)
  // ---------------------------------------------------------------------------

  /**
   * Fan-out tới nhiều người nhận. Dedupe theo (referenceType + referenceId) GLOBAL
   * để một sự kiện (vd: chương trình KM mới) chỉ sinh 1 đợt gửi.
   */
  async broadcast(
    input: Omit<CreateNotificationInput, 'userId' | 'memberId'>,
    target: NotificationTarget,
  ) {
    if (!input.referenceType || !input.referenceId) {
      throw new BadRequestException('Broadcast yêu cầu referenceType + referenceId để chống trùng lặp');
    }

    const dup = await this.prisma.notification.findFirst({
      where: { referenceType: input.referenceType, referenceId: input.referenceId },
    });
    if (dup) return { created: 0, skipped: true };

    const targets = await this.resolveTargets(target);

    if (targets.length === 0) return { created: 0, skipped: false };

    await this.prisma.notification.createMany({
      data: targets.map((t) => ({
        userId: t.userId ?? null,
        memberId: t.memberId ?? null,
        type: input.type,
        title: input.title,
        content: input.content,
        link: input.link ?? null,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        data: serializeJsonText(input.data),
      })),
    });

    return { created: targets.length, skipped: false };
  }

  private async resolveTargets(target: NotificationTarget) {
    const roleToUserRole: Partial<Record<NotificationTarget, UserRole>> = {
      MEMBERS: UserRole.MEMBER,
      TRAINERS: UserRole.TRAINER,
      STAFF: UserRole.STAFF,
      MANAGERS: UserRole.MANAGER,
      ADMIN: UserRole.ADMIN,
    };

    if (target === 'ALL') {
      const users = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, member: { select: { id: true } } },
      });
      return users.map((u) => ({ userId: u.id, memberId: u.member?.id ?? null }));
    }

    const users = await this.prisma.user.findMany({
      where: { role: roleToUserRole[target], status: 'ACTIVE' },
      select: { id: true, member: { select: { id: true } } },
    });
    return users.map((u) => ({ userId: u.id, memberId: u.member?.id ?? null }));
  }

  // ---------------------------------------------------------------------------
  // Cá nhân: me / unread / read / read-all / delete
  // ---------------------------------------------------------------------------

  /** Tìm scope (memberId hoặc userId) cho tài khoản đang đăng nhập */
  private async resolveScope(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    return { memberId: member?.id ?? null, userId };
  }

  async getMine(userId: string, query: { tab?: string; type?: string; limit?: number } = {}) {
    const { memberId, userId: uid } = await this.resolveScope(userId);

    const where: Prisma.NotificationWhereInput = {};
    if (memberId) where.memberId = memberId;
    else where.userId = uid;

    if (query.tab === 'unread') where.isRead = false;
    if (query.tab === 'read') where.isRead = true;
    if (query.type) where.type = query.type;

    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const [data, unreadCount, readCount, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
      this.prisma.notification.count({ where: { ...where, isRead: true } }),
      this.prisma.notification.count({ where }),
    ]);

    return { data: data.map((item) => this.withParsedData(item)), unreadCount, readCount, total };
  }

  async getUnreadCount(userId: string) {
    const { memberId, userId: uid } = await this.resolveScope(userId);
    return this.prisma.notification.count({
      where: { ...(memberId ? { memberId } : { userId: uid }), isRead: false },
    });
  }

  /** Member chỉ được thao tác thông báo của chính mình (ADMIN có thể xem/đọc mọi thứ) */
  private async assertOwner(actorUserId: string, role: string, notificationId: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    if (role === UserRole.ADMIN) return notif;

    const { memberId, userId: uid } = await this.resolveScope(actorUserId);
    const owned =
      (memberId && notif.memberId === memberId) || (!memberId && notif.userId === uid);
    if (!owned) {
      throw new ForbiddenException('Bạn không có quyền thao tác thông báo này');
    }
    return notif;
  }

  async markRead(actorUserId: string, role: string, id: string) {
    await this.assertOwner(actorUserId, role, id);
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Đã đánh dấu là đã đọc', notification: this.withParsedData(updated) };
  }

  async markAllRead(actorUserId: string, role: string) {
    const { memberId, userId: uid } = await this.resolveScope(actorUserId);
    const where: Prisma.NotificationWhereInput = { isRead: false };
    if (role !== UserRole.ADMIN) {
      if (memberId) where.memberId = memberId;
      else where.userId = uid;
    }
    const result = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'Đã đánh dấu tất cả là đã đọc', updated: result.count };
  }

  async remove(actorUserId: string, role: string, id: string) {
    await this.assertOwner(actorUserId, role, id);
    await this.prisma.notification.delete({ where: { id } });
    return { message: 'Đã xóa thông báo' };
  }

  // ---------------------------------------------------------------------------
  // Admin: danh sách toàn hệ thống + tạo thông báo hàng loạt (announcement)
  // ---------------------------------------------------------------------------

  async findAllAdmin(query: {
    type?: string;
    from?: string;
    to?: string;
    unread?: string;
    role?: string;
    search?: string;
    limit?: number;
  } = {}) {
    const where: Prisma.NotificationWhereInput = {};
    if (query.type) where.type = query.type;
    if (query.unread === 'true') where.isRead = false;
    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    if (query.role) {
      where.user = { is: { role: query.role as UserRole } };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search.trim() } },
        { content: { contains: query.search.trim() } },
      ];
    }

    const limit = Math.min(200, Math.max(1, query.limit || 100));
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          member: { select: { id: true, code: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return { data: data.map((item) => this.withParsedData(item)), total, unreadCount };
  }

  /**
   * POST /notifications/announce — ADMIN/MANAGER tạo thông báo hàng loạt.
   * Target: ALL / MEMBERS / TRAINERS / ADMIN.
   */
  async announce(dto: {
    title: string;
    message: string;
    target: 'ALL' | 'MEMBERS' | 'TRAINERS' | 'STAFF' | 'MANAGERS' | 'ADMIN';
    startAt?: string;
    endAt?: string;
  }) {
    if (!dto.title?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Tiêu đề và nội dung không được bỏ trống');
    }

    const refType = 'ANNOUNCEMENT';
    const refId = `ann-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const data: Prisma.InputJsonValue = {
      target: dto.target,
      startAt: dto.startAt ?? null,
      endAt: dto.endAt ?? null,
      isAnnouncement: true,
    };

    const result = await this.broadcast(
      {
        type: 'SYSTEM',
        title: dto.title,
        content: dto.message,
        link: null,
        referenceType: refType,
        referenceId: refId,
        data,
      },
      dto.target,
    );

    return { message: 'Đã gửi thông báo', ...result };
  }
}