import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService, NotificationType } from './notifications.service';
import { MAIL_EVENTS } from '../mail/mail.events';

/**
 * STEP 8 — quét định kỳ (không cần cron, dùng setInterval nội bộ) để sinh thông báo:
 * - Membership sắp hết hạn (7 ngày) / vừa hết hạn
 * - Promotion sắp kết thúc (3 ngày)
 * Dedupe bằng referenceType + referenceId → không gửi trùng (in-app lẫn email).
 * Email nhắc gia hạn chạy NỀN qua EventEmitter (Nhóm B) — không chặn job.
 */
@Injectable()
export class NotificationTickerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationTickerService.name);
  private timer?: NodeJS.Timeout;
  private readonly INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 giờ
  /** Ngưỡng "sắp hết hạn" — khớp EXPIRING_SOON_DAYS = 7 của frontend. */
  private readonly EXPIRING_SOON_DAYS = 7;

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // Chạy 1 lần khi khởi động + lặp lại mỗi 6h
    void this.run();
    this.timer = setInterval(() => void this.run(), this.INTERVAL_MS);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    try {
      await this.checkMembershipExpiry();
      await this.checkPromotionEnding();
    } catch (err) {
      this.logger.error('Notification ticker error', (err as Error)?.stack || String(err));
    }
  }

  /** Membership: sắp hết hạn trong 7 ngày → nhắc; quá hạn → EXPIRED + thông báo */
  private async checkMembershipExpiry() {
    const now = new Date();
    const soon = new Date(now.getTime() + this.EXPIRING_SOON_DAYS * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.membership.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: soon } },
      select: {
        id: true,
        memberId: true,
        endDate: true,
        package: { select: { name: true } },
        // Lấy email hội viên (qua user) để gửi email nhắc gia hạn nền
        member: {
          select: {
            code: true,
            fullName: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    // Hội viên ĐÃ gia hạn (có gói ACTIVE bắt đầu ở tương lai) thì không nhắc "gia hạn ngay" nữa
    const renewedMemberIds = new Set(
      (
        await this.prisma.membership.findMany({
          where: { status: 'ACTIVE', startDate: { gt: now } },
          select: { memberId: true },
        })
      ).map((r) => r.memberId),
    );

    let expiringNotified = 0;
    for (const m of expiring) {
      if (renewedMemberIds.has(m.memberId)) continue;
      expiringNotified++;

      // Email nhắc gia hạn: chỉ gửi LẦN ĐẦU quét thấy (chống spam — job chạy mỗi 6h).
      // Kiểm tra trùng theo đúng cơ chế dedupe của Notification (MEMBERSHIP_EXPIRING + membershipId).
      const email = m.member.user?.email;
      if (email) {
        const alreadyNotified = await this.prisma.notification.findFirst({
          where: {
            referenceType: 'MEMBERSHIP_EXPIRING',
            referenceId: m.id,
            memberId: m.memberId,
          },
          select: { id: true },
        });
        if (!alreadyNotified) {
          const daysLeft = Math.max(
            1,
            Math.ceil((m.endDate.getTime() - now.getTime()) / 86_400_000),
          );
          // Emit KHÔNG await — MailListener xử lý nền (Nhóm B)
          this.eventEmitter.emit(MAIL_EVENTS.MEMBERSHIP_EXPIRING, {
            userId: m.memberId,
            email,
            fullName: m.member.fullName,
            packageName: m.package?.name ?? 'tập luyện',
            expiresAt: m.endDate,
            daysLeft,
          });
        }
      }

      await this.notificationsService.create({
        memberId: m.memberId,
        type: 'MEMBERSHIP' as NotificationType,
        title: 'Gói tập sắp hết hạn ⏰',
        content: `Gói ${m.package?.name ?? 'tập luyện'} của bạn hết hạn ngày ${m.endDate.toLocaleDateString('vi-VN')}. Gia hạn ngay để không gián đoạn lịch tập.`,
        link: '/member/membership',
        referenceType: 'MEMBERSHIP_EXPIRING',
        referenceId: m.id,
      });

      // Báo tổ quản trị để kịp nhắc khách gia hạn (dedupe theo membershipId)
      await this.notificationsService.notifyAdmins({
        type: 'MEMBERSHIP' as NotificationType,
        title: 'Hội viên sắp hết hạn gói ⏰',
        content: `${m.member.fullName} (${m.member.code}) hết hạn gói ${m.package?.name ?? 'tập luyện'} vào ${m.endDate.toLocaleDateString('vi-VN')}.`,
        link: `/admin/members/${m.memberId}`,
        referenceType: 'MEMBERSHIP_EXPIRING',
        referenceId: m.id,
      });
    }

    // Hết hạn: cập nhật trạng thái + thông báo
    const expiredRows = await this.prisma.membership.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      select: {
        id: true,
        memberId: true,
        package: { select: { name: true } },
        member: { select: { code: true, fullName: true } },
      },
    });
    if (expiredRows.length) {
      await this.prisma.membership.updateMany({
        where: { id: { in: expiredRows.map((r) => r.id) } },
        data: { status: 'EXPIRED' },
      });
      for (const r of expiredRows) {
        await this.notificationsService.create({
          memberId: r.memberId,
          type: 'MEMBERSHIP' as NotificationType,
          title: 'Gói tập đã hết hạn ⚠️',
          content: `Gói ${r.package?.name ?? 'tập luyện'} của bạn đã hết hạn. Gia hạn để tiếp tục sử dụng phòng tập.`,
          link: '/member/membership',
          referenceType: 'MEMBERSHIP_EXPIRED',
          referenceId: r.id,
        });

        // Báo tổ quản trị: hội viên vừa hết hạn (dedupe theo membershipId)
        await this.notificationsService.notifyAdmins({
          type: 'MEMBERSHIP' as NotificationType,
          title: 'Hội viên đã hết hạn gói ⚠️',
          content: `${r.member.fullName} (${r.member.code}) đã hết hạn gói ${r.package?.name ?? 'tập luyện'}.`,
          link: `/admin/members/${r.memberId}`,
          referenceType: 'MEMBERSHIP_EXPIRED',
          referenceId: r.id,
        });
      }
    }

    if (expiringNotified || expiredRows.length) {
      this.logger.log(
        `Ticker memberships: ${expiringNotified} sắp hết hạn (bỏ qua ${expiring.length - expiringNotified} đã gia hạn), ${expiredRows.length} đã hết hạn`,
      );
    }
  }

  /** Promotion: ACTIVE sắp kết thúc trong 3 ngày → nhắc hội viên */
  private async checkPromotionEnding() {
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const ending = await this.prisma.promotion.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: soon } },
      select: { id: true, code: true, name: true, endDate: true },
    });
    for (const p of ending) {
      await this.notificationsService.broadcast(
        {
          type: 'PROMOTION' as NotificationType,
          title: 'Khuyến mãi sắp kết thúc 🏃',
          content: `Mã ${p.code} — ${p.name} chỉ còn đến ${p.endDate.toLocaleDateString('vi-VN')}. Đăng ký gói tập ngay để nhận ưu đãi!`,
          link: '/packages',
          referenceType: 'PROMOTION_ENDING',
          referenceId: p.id,
        },
        'MEMBERS',
      );
    }
  }

}