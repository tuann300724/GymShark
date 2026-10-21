import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsRepository } from './repository/notifications.repository';
import { NOTIFICATIONS_REPOSITORY } from './repository/notifications.tokens';

export type NotificationTarget =
  | 'ALL'
  | 'MEMBERS'
  | 'TRAINERS'
  | 'STAFF'
  | 'MANAGERS'
  | { branchId: string };

/** Các loại thông báo (STEP 8) — lưu dạng string trong cột type */
export const NOTIFICATION_TYPES = [
  'PAYMENT',
  'MEMBERSHIP',
  'CHECKIN',
  'TRAINING',
  'PROMOTION',
  'EQUIPMENT',
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
  constructor(
    private prisma: PrismaService,
    @Inject(NOTIFICATIONS_REPOSITORY) private repo: NotificationsRepository,
  ) {}

  // ---------------------------------------------------------------------------
  // Tạo thông báo với chống trùng lặp (referenceType + referenceId + người nhận)
  // ---------------------------------------------------------------------------

  /**
   * Tạo 1 thông báo. Nếu có referenceType/referenceId và đã tồn tại thông báo
   * cùng cặp ref + cùng người nhận → bỏ qua (không spam cùng sự kiện).
   */
  async create(input: CreateNotificationInput): Promise<void> {
    const where = {
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.memberId ? { memberId: input.memberId } : {}),
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
    };

    if (input.referenceType && input.referenceId) {
      const dup = await this.repo.findFirst(where);
      if (dup) return;
    }

    await this.repo.create({
      userId: input.userId ?? null,
      memberId: input.memberId ?? null,
      type: input.type,
      title: input.title,
      content: input.content,
      link: input.link ?? null,
      data: (input.data as any) ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
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
        data: (input.data as Prisma.InputJsonValue) ?? undefined,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
  }

  /** Fan-out tới tất cả ADMIN/MANAGER/STAFF (dedupe global theo ref) — dùng cho cảnh báo vận hành */
  async fanoutToStaff(input: {
    type: NotificationType;
    title: string;
    content: string;
    link?: string | null;
    referenceType: string;
    referenceId: string;
    data?: Prisma.InputJsonValue;
  }) {
    const dup = await this.repo.findFirst({ referenceType: input.referenceType, referenceId: input.referenceId });
    if (dup) return { created: 0, skipped: true };

    const staffUsers = await this.prisma.user.findMany({
      where: { role: { in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] }, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!staffUsers.length) return { created: 0, skipped: false };

    await this.repo.createMany(staffUsers.map((u) => ({
      userId: u.id,
      type: input.type,
      title: input.title,
      content: input.content,
      link: input.link ?? null,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      data: input.data ?? null,
    })));
    return { created: staffUsers.length, skipped: false };
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

    const dup = await this.repo.findFirst({ referenceType: input.referenceType, referenceId: input.referenceId });
    if (dup) return { created: 0, skipped: true };

    const targets = await this.resolveTargets(target);

    if (targets.length === 0) return { created: 0, skipped: false };

    await this.repo.createMany(targets.map((t) => ({
      userId: t.userId ?? null,
      memberId: t.memberId ?? null,
      type: input.type,
      title: input.title,
      content: input.content,
      link: input.link ?? null,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      data: (input.data as any) ?? null,
    })));

    return { created: targets.length, skipped: false };
  }

  private async resolveTargets(target: NotificationTarget) {
    if (typeof target === 'object' && 'branchId' in target) {
      const users = await this.prisma.user.findMany({
        where: { branchId: target.branchId, status: 'ACTIVE' },
        select: { id: true, role: true, member: { select: { id: true } } },
      });
      return users.map((u) => ({ userId: u.id, memberId: u.member?.id ?? null }));
    }

    const roleToUserRole: Partial<Record<Exclude<NotificationTarget, object>, UserRole>> = {
      MEMBERS: UserRole.MEMBER,
      TRAINERS: UserRole.TRAINER,
      STAFF: UserRole.STAFF,
      MANAGERS: UserRole.MANAGER,
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

    const where: any = {};
    if (memberId) where.memberId = memberId;
    else where.userId = uid;

    if (query.tab === 'unread') where.isRead = false;
    if (query.tab === 'read') where.isRead = true;
    if (query.type) where.type = query.type;

    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const [data, unreadCount, readCount, total] = await Promise.all([
      this.repo.findMany(where, { take: limit }),
      this.repo.count({ ...where, isRead: false }),
      this.repo.count({ ...where, isRead: true }),
      this.repo.count(where),
    ]);

    return { data, unreadCount, readCount, total };
  }

  async getUnreadCount(userId: string) {
    const { memberId, userId: uid } = await this.resolveScope(userId);
    return this.repo.count({ ...(memberId ? { memberId } : { userId: uid }), isRead: false });
  }

  /** Member chỉ được thao tác thông báo của chính mình (ADMIN có thể xem/đọc mọi thứ) */
  private async assertOwner(actorUserId: string, role: string, notificationId: string) {
    const notif = await this.repo.findOne(notificationId);
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
    await this.repo.update(id, { isRead: true, readAt: new Date() });
    const updated = await this.repo.findOne(id);
    return { message: 'Đã đánh dấu là đã đọc', notification: updated };
  }

  async markAllRead(actorUserId: string, role: string) {
    const { memberId, userId: uid } = await this.resolveScope(actorUserId);
    const where: any = { isRead: false };
    if (role !== UserRole.ADMIN) {
      if (memberId) where.memberId = memberId;
      else where.userId = uid;
    }
    const updated = await this.repo.updateMany(where, { isRead: true, readAt: new Date() });
    return { message: 'Đã đánh dấu tất cả là đã đọc', updated };
  }

  async remove(actorUserId: string, role: string, id: string) {
    await this.assertOwner(actorUserId, role, id);
    await this.repo.delete(id);
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
    const limit = Math.min(200, Math.max(1, query.limit || 100));
    return await this.repo.adminList({ ...query, limit });
  }

  /**
   * POST /notifications/announce — ADMIN/MANAGER tạo thông báo hàng loạt.
   * Target: ALL / MEMBERS / TRAINERS / STAFF / MANAGERS / SPECIFIC_BRANCH.
   */
  async announce(dto: {
    title: string;
    message: string;
    target: 'ALL' | 'MEMBERS' | 'TRAINERS' | 'STAFF' | 'MANAGERS' | 'SPECIFIC_BRANCH';
    branchId?: string;
    startAt?: string;
    endAt?: string;
  }) {
    if (!dto.title?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Tiêu đề và nội dung không được bỏ trống');
    }
    if (dto.target === 'SPECIFIC_BRANCH' && !dto.branchId) {
      throw new BadRequestException('Vui lòng chọn chi nhánh cho thông báo theo chi nhánh');
    }

    const refType = 'ANNOUNCEMENT';
    const refId = `ann-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

    const target: NotificationTarget =
      dto.target === 'SPECIFIC_BRANCH' ? { branchId: dto.branchId! } : dto.target;

    const data: Prisma.InputJsonValue = {
      target: dto.target,
      branchId: dto.branchId ?? null,
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
      target,
    );

    return { message: 'Đã gửi thông báo', ...result };
  }
}