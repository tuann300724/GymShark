import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService, NotificationType } from './notifications.service';

/**
 * STEP 8 — quét định kỳ (không cần cron, dùng setInterval nội bộ) để sinh thông báo:
 * - Membership sắp hết hạn (3 ngày) / vừa hết hạn
 * - Promotion sắp kết thúc (3 ngày)
 * - Thiết bị đến hạn bảo trì / quá hạn / hỏng
 * Dedupe bằng referenceType + referenceId → không gửi trùng.
 */
@Injectable()
export class NotificationTickerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationTickerService.name);
  private timer?: NodeJS.Timeout;
  private readonly INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 giờ

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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
      await this.checkEquipmentMaintenance();
    } catch (err) {
      this.logger.error('Notification ticker error', (err as Error)?.stack || String(err));
    }
  }

  /** Membership: sắp hết hạn trong 3 ngày → nhắc; quá hạn → EXPIRED + thông báo */
  private async checkMembershipExpiry() {
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.membership.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now, lte: soon } },
      select: {
        id: true,
        memberId: true,
        endDate: true,
        package: { select: { name: true } },
        member: { select: { fullName: true } },
      },
    });
    for (const m of expiring) {
      await this.notificationsService.create({
        memberId: m.memberId,
        type: 'MEMBERSHIP' as NotificationType,
        title: 'Gói tập sắp hết hạn ⏰',
        content: `Gói ${m.package?.name ?? 'tập luyện'} của bạn hết hạn ngày ${m.endDate.toLocaleDateString('vi-VN')}. Gia hạn ngay để không gián đoạn lịch tập.`,
        link: '/member/membership',
        referenceType: 'MEMBERSHIP_EXPIRING',
        referenceId: m.id,
      });
    }

    // Hết hạn: cập nhật trạng thái + thông báo
    const expiredRows = await this.prisma.membership.findMany({
      where: { status: 'ACTIVE', endDate: { lt: now } },
      select: { id: true, memberId: true, package: { select: { name: true } } },
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
      }
    }

    if (expiring.length || expiredRows.length) {
      this.logger.log(`Ticker memberships: ${expiring.length} sắp hết hạn, ${expiredRows.length} đã hết hạn`);
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

  /** Thiết bị: đến hạn bảo trì / quá hạn / hỏng → thông báo ADMIN/MANAGER/STAFF */
  private async checkEquipmentMaintenance() {
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const due = await this.prisma.equipment.findMany({
      where: {
        status: { in: ['AVAILABLE', 'IN_USE', 'OPERATIONAL'] },
        nextMaintenanceAt: { lte: soon },
      },
      select: { id: true, code: true, name: true, nextMaintenanceAt: true, branch: { select: { name: true } } },
    });
    for (const e of due) {
      await this.notificationsService.fanoutToStaff({
        type: 'EQUIPMENT',
        title: 'Thiết bị cần bảo trì 🛠️',
        content: `${e.name} (${e.code}) tại ${e.branch?.name ?? ''} ${
          e.nextMaintenanceAt && e.nextMaintenanceAt < now
            ? `đã QUÁ HẠN bảo trì từ ${e.nextMaintenanceAt.toLocaleDateString('vi-VN')}`
            : `đến hạn bảo trì ${e.nextMaintenanceAt?.toLocaleDateString('vi-VN')}`
        }.`,
        link: '/admin/equipment',
        referenceType: 'EQUIPMENT_MAINTENANCE',
        referenceId: e.id,
      });
    }

    const broken = await this.prisma.equipment.findMany({
      where: { status: 'BROKEN' },
      select: { id: true, code: true, name: true, branch: { select: { name: true } } },
    });
    for (const e of broken) {
      await this.notificationsService.fanoutToStaff({
        type: 'EQUIPMENT',
        title: 'Thiết bị hỏng 🚨',
        content: `${e.name} (${e.code}) tại ${e.branch?.name ?? ''} đang trong tình trạng HỎNG. Kiểm tra và lên lịch sửa chữa.`,
        link: '/admin/equipment',
        referenceType: 'EQUIPMENT_BROKEN',
        referenceId: e.id,
      });
    }
  }
}