import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '../../common/constants/db-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { Role } from '../../common/enums/role.enum';
import { PaymentGatewayService } from './gateway/payment-gateway.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentListQueryDto } from './dto/payment-list-query.dto';
import { CassoService } from '../casso/casso.service';
import { BANK_INFO } from './bank-info';
import { MAIL_EVENTS } from '../mail/mail.events';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

interface Actor {
  id: string;
  role: string;
  fullName?: string;
  shiftId?: string;
  cassoSettlement?: boolean;
}

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly cassoAutoReconcile: boolean;
  private readonly cassoPollIntervalMs: number;
  private cassoPollTimer?: NodeJS.Timeout;
  private cassoReconcileRunning = false;

  constructor(
    private prisma: PrismaService,
    private gatewayService: PaymentGatewayService,
    private auditService: AuditService,
    private cassoService: CassoService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {
    this.cassoAutoReconcile = this.configService.get<string>('CASSO_AUTO_RECONCILE')?.trim().toLowerCase() === 'true';
    const configuredInterval = Number(this.configService.get<string>('CASSO_POLL_INTERVAL_MS'));
    this.cassoPollIntervalMs = Number.isFinite(configuredInterval) && configuredInterval >= 1_000 ? configuredInterval : 2_000;
  }

  onModuleInit() {
    if (!this.cassoAutoReconcile) return;
    if (!this.configService.get<string>('CASSO_SHEET_URL')?.trim()) {
      this.logger.warn('CASSO_AUTO_RECONCILE is enabled but CASSO_SHEET_URL is missing');
      return;
    }

    this.logger.log(`CASSO auto-reconcile enabled every ${this.cassoPollIntervalMs}ms`);
    void this.reconcilePendingCassoPayments();
    this.cassoPollTimer = setInterval(() => void this.reconcilePendingCassoPayments(), this.cassoPollIntervalMs);
  }

  onModuleDestroy() {
    if (this.cassoPollTimer) clearInterval(this.cassoPollTimer);
  }

  async assertOpenShiftForStaff(staffId: string): Promise<string> {
    const shifts = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT TOP (2) CONVERT(nvarchar(36), id) AS id
      FROM dbo.StaffShift
      WHERE staffId = CONVERT(uniqueidentifier, ${staffId})
        AND UPPER(status) = N'IN_PROGRESS'
        AND startTime <= SYSUTCDATETIME()
        AND endTime > SYSUTCDATETIME()
    `);
    if (shifts.length === 0) {
      throw new ForbiddenException('Bạn cần bắt đầu ca làm đang được phân công trước khi phục vụ hội viên');
    }
    if (shifts.length > 1) {
      throw new ConflictException('Bạn có nhiều ca đang mở cùng lúc. Hãy nhờ quản lý xử lý trước khi thu tiền.');
    }
    return shifts[0].id;
  }

  async assertShiftActiveInTransaction(
    tx: Prisma.TransactionClient,
    staffId: string,
    shiftId: string,
  ) {
    const shifts = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT TOP (1) CONVERT(nvarchar(36), id) AS id
      FROM dbo.StaffShift WITH (UPDLOCK, HOLDLOCK)
      WHERE id = CONVERT(uniqueidentifier, ${shiftId})
        AND staffId = CONVERT(uniqueidentifier, ${staffId})
        AND UPPER(status) = N'IN_PROGRESS'
        AND startTime <= SYSUTCDATETIME()
        AND endTime > SYSUTCDATETIME()
    `);
    if (shifts.length !== 1) {
      throw new ForbiddenException('Ca làm đã kết thúc hoặc không còn hợp lệ; không thể tạo giao dịch tại quầy');
    }
  }

  private async reconcilePendingCassoPayments() {
    if (this.cassoReconcileRunning) return;
    this.cassoReconcileRunning = true;

    try {
      const pendingPayments = await this.prisma.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          method: PaymentMethod.BANK_TRANSFER,
        },
        select: { id: true, notes: true, createdAt: true },
      });

      for (const payment of pendingPayments) {
        try {
          const staffPosMatch = payment.notes?.match(
            /\[STAFF_POS:([0-9a-f-]{36}):([0-9a-f-]{36})\]/i,
          );
          const legacyStaffPosPayment = payment.notes?.includes('[STAFF_POS') ?? false;
          let actor: Actor | null = null;
          if (staffPosMatch) {
            const activeShifts = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
              SELECT TOP (2) CONVERT(nvarchar(36), id) AS id
              FROM dbo.StaffShift
              WHERE staffId = CONVERT(uniqueidentifier, ${staffPosMatch[1]})
              AND id = CONVERT(uniqueidentifier, ${staffPosMatch[2]})
              AND UPPER(status) IN (N'IN_PROGRESS', N'COMPLETED')
              AND startTime <= ${payment.createdAt}
              AND endTime > ${payment.createdAt}
            `);
            if (activeShifts.length !== 1) continue;
            actor = {
              id: staffPosMatch[1],
              role: Role.STAFF,
              shiftId: staffPosMatch[2],
              cassoSettlement: true,
            };
          } else if (legacyStaffPosPayment) {
            continue;
          }

          const result = await this.verifyCasso(payment.id, actor);
          if (result.matched && result.status === 'PAID') {
            this.logger.log(`CASSO automatically confirmed payment ${payment.id}`);
          }
        } catch (error) {
          this.logger.error(`CASSO reconciliation failed for payment ${payment.id}`, error instanceof Error ? error.stack : String(error));
        }
      }
    } catch (error) {
      this.logger.error('Unable to load pending CASSO payments', error instanceof Error ? error.stack : String(error));
    } finally {
      this.cassoReconcileRunning = false;
    }
  }

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  /**
   * Danh sách thanh toán (admin) + thống kê dashboard:
   * Total Revenue, Today's Revenue, Pending, Paid, Failed, Refunded.
   * Cards luôn toàn cục; bảng tôn trọng filter/search/pagination.
   */
  async findAll(query: PaymentListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.memberId) where.memberId = query.memberId;
    if (query.packageId) where.membership = { is: { packageId: query.packageId } };
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = this.endOfDay(new Date(query.to));
    }
    if (query.search) {
      const q = query.search.trim();
      where.OR = [
        { code: { contains: q } },
        { transactionRef: { contains: q } },
        { member: { fullName: { contains: q } } },
        { member: { email: { contains: q } } },
        { member: { phone: { contains: q } } },
        { member: { code: { contains: q } } },
        { invoice: { invoiceNumber: { contains: q } } },
      ];
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [data, total, paidAgg, revenueTodayAgg, pendingCount, paidCount, failedCount, cancelledCount, refundedAgg] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              code: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          membership: {
            include: { package: { select: { id: true, name: true } } },
          },
          promotion: { select: { id: true, code: true, name: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
          confirmedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID', paidAt: { gte: startOfToday } },
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'PAID' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'CANCELLED' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'REFUNDED' },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      stats: {
        totalRevenue: paidAgg._sum.amount || 0,
        revenueToday: revenueTodayAgg._sum.amount || 0,
        pendingCount,
        paidCount,
        failedCount,
        cancelledCount,
        refundedCount: refundedAgg._count,
        refundedTotal: refundedAgg._sum.amount || 0,
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            code: true,
            fullName: true,
            email: true,
            phone: true,
            address: true,
            gender: true,
            joinedAt: true,
          },
        },
        membership: { include: { package: true } },
        promotion: true,
        invoice: true,
        confirmedBy: { select: { id: true, fullName: true, role: true } },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    return payment;
  }

  /**
   * Xác nhận thanh toán (PENDING → PAID):
   * - set paidAt + confirmedBy/confirmedAt
   * - Membership PENDING → ACTIVE
   * - Invoice ISSUED → PAID
   * - tăng lượt dùng promotion, gửi thông báo
   * Toàn bộ trong transaction — lỗi 1 bước là rollback.
   */
  async confirm(id: string, actor: Actor | null, dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        membership: { include: { package: true } },
        // Số hóa đơn chính thức (INV-...) để gửi email
        invoice: { select: { invoiceNumber: true } },
        // Lấy email hội viên và tài khoản liên kết để gửi thông báo nền
        member: {
          select: {
            id: true,
            code: true,
            fullName: true,
            email: true,
            user: { select: { email: true } },
          },
        },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Chỉ hóa đơn đang chờ (PENDING) mới có thể xác nhận');
    }
    const staffPosMatch = payment.notes?.match(
      /\[STAFF_POS:([0-9a-f-]{36}):([0-9a-f-]{36})\]/i,
    );
    if (payment.notes?.includes('[STAFF_POS') && !staffPosMatch) {
      throw new ConflictException('Giao dịch tại quầy chưa được gắn với ca cụ thể; cần quản lý xử lý');
    }
    if (actor?.role === Role.STAFF && staffPosMatch) {
      if (staffPosMatch[1].toLowerCase() !== actor.id.toLowerCase()) {
        throw new ForbiddenException('Chỉ nhân viên đã tạo giao dịch tại quầy mới có thể xác nhận giao dịch này');
      }
      if (actor.shiftId && staffPosMatch[2].toLowerCase() !== actor.shiftId.toLowerCase()) {
        throw new ConflictException('Giao dịch này thuộc ca khác, không thể ghi nhận vào ca hiện tại');
      }
      actor = { ...actor, shiftId: staffPosMatch[2] };
    }

    // STAFF chỉ xác nhận được phương thức xác nhận thủ công (CASH / BANK_TRANSFER)
    const gateway = this.gatewayService.getGateway(payment.method as Exclude<PaymentMethod, 'CREDIT_CARD'>);
    if (actor?.role === Role.STAFF && !gateway.manualConfirmation) {
      throw new ForbiddenException('Nhân viên chỉ xác nhận được thanh toán Tiền mặt / Chuyển khoản');
    }

    // Mã giao dịch phải unique (kiểm tra application-level, dù DB cũng có unique index)
    const transactionRef = dto.transactionRef?.trim();
    if (transactionRef) {
      const dup = await this.prisma.payment.findFirst({
        where: { transactionRef, id: { not: id } },
        select: { id: true, code: true },
      });
      if (dup) {
        throw new ConflictException(`Mã giao dịch "${transactionRef}" đã được dùng cho hóa đơn ${dup.code}. Vui lòng kiểm tra lại.`);
      }
    }

    const now = new Date();
    const packageChange = payment.notes?.match(/^\[PACKAGE_CHANGE:([^\]]+)\]/);
    let staffShiftId: string | null = null;
    const result = await this.prisma.$transaction(async (tx) => {
      if (actor?.role === Role.STAFF || staffPosMatch) {
        const shiftStaffId = staffPosMatch?.[1] ?? actor?.id;
        if (!shiftStaffId) {
          throw new ForbiddenException('Không xác định được nhân viên phụ trách ca');
        }
        const shiftId = staffPosMatch?.[2] ?? actor?.shiftId;
        const shifts = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
          SELECT TOP (1) CONVERT(nvarchar(36), id) AS id
          FROM dbo.StaffShift WITH (UPDLOCK, HOLDLOCK)
          WHERE staffId = CONVERT(uniqueidentifier, ${shiftStaffId})
            ${shiftId ? Prisma.sql`AND id = CONVERT(uniqueidentifier, ${shiftId})` : Prisma.empty}
            ${
              actor.cassoSettlement
                ? Prisma.sql`
                  AND UPPER(status) IN (N'IN_PROGRESS', N'COMPLETED')
                  AND startTime <= ${payment.createdAt}
                  AND endTime > ${payment.createdAt}
                `
                : Prisma.sql`
                  AND UPPER(status) = N'IN_PROGRESS'
                  AND startTime <= ${now}
                  AND endTime > ${now}
                `
            }
          ORDER BY startTime DESC
        `);
        if (shifts.length === 0) {
          throw new ForbiddenException('Bạn cần bắt đầu ca làm đang được phân công trước khi xác nhận thanh toán');
        }
        if (shifts.length > 1) {
          throw new ConflictException('Bạn có nhiều ca đang mở cùng lúc. Hãy nhờ quản lý xử lý trước khi thu tiền.');
        }
        staffShiftId = shifts[0].id;
      }

      const updateCount = await tx.payment.updateMany({
        where: { id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          confirmedById: actor?.id ?? null,
          confirmedAt: now,
          ...(staffShiftId ? { staffShiftId } : {}),
          ...(transactionRef ? { transactionRef } : {}),
          ...(dto.note ? { notes: [payment.notes, dto.note].filter(Boolean).join(' | ') } : {}),
        },
      });
      if (updateCount.count !== 1) {
        throw new ConflictException('Giao dịch vừa được xác nhận bởi một thao tác khác');
      }
      const updated = await tx.payment.findUnique({ where: { id } });
      if (!updated) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');

      if (payment.promotionId) {
        await tx.promotion.update({
          where: { id: payment.promotionId },
          data: { usedCount: { increment: 1 } },
        });
      }

      let activatedMembership = null;
      if (payment.membership && payment.membership.status === 'PENDING') {
        if (packageChange) {
          const previousMembership = await tx.membership.findUnique({
            where: { id: packageChange[1] },
            select: { id: true, memberId: true, status: true },
          });
          if (!previousMembership || previousMembership.memberId !== payment.memberId || previousMembership.status !== 'ACTIVE') {
            throw new ConflictException('Gói tập cũ không còn hiệu lực; không thể xác nhận đổi gói');
          }
          await tx.membership.update({
            where: { id: previousMembership.id },
            data: { status: 'CANCELLED' },
          });
        }
        activatedMembership = await tx.membership.update({
          where: { id: payment.membership.id },
          data: {
            status: 'ACTIVE',
            ...(packageChange
              ? {
                  startDate: now,
                  endDate: new Date(now.getTime() + payment.membership.package.durationDays * 86400000),
                }
              : {}),
          },
        });
      }

      await tx.invoice.updateMany({
        where: { paymentId: id, status: InvoiceStatus.ISSUED },
        data: { status: InvoiceStatus.PAID },
      });

      await tx.notification.create({
        data: {
          memberId: payment.member.id,
          title: 'Thanh toán thành công ✅',
          content: `Hóa đơn ${payment.code} đã được xác nhận. ${
            activatedMembership ? `Gói tập của bạn đã được kích hoạt và có hiệu lực đến ${activatedMembership.endDate.toLocaleDateString('vi-VN')}.` : ''
          }`,
          type: 'PAYMENT',
          link: '/member/payments',
          referenceType: 'PAYMENT_CONFIRMED',
          referenceId: payment.id,
        },
      });

      // Thưởng giới thiệu: khi người được giới thiệu kích hoạt gói đầu tiên,
      // người giới thiệu có gói hiệu lực được cộng thêm 7 ngày tập (1 lần duy nhất)
      if (activatedMembership && !packageChange) {
        const referred = await tx.member.findUnique({
          where: { id: activatedMembership.memberId },
          select: {
            id: true,
            fullName: true,
            referredById: true,
            referralRewardedAt: true,
          },
        });
        if (referred?.referredById && !referred.referralRewardedAt) {
          const BONUS_DAYS = 7;
          const referrerPack = await tx.membership.findFirst({
            where: {
              memberId: referred.referredById,
              status: 'ACTIVE',
              endDate: { gte: new Date() },
            },
            orderBy: { endDate: 'desc' },
          });
          if (referrerPack && referrerPack.endDate) {
            const newEndDate = new Date(referrerPack.endDate.getTime() + BONUS_DAYS * 86400_000);
            await tx.membership.update({
              where: { id: referrerPack.id },
              data: { endDate: newEndDate },
            });
            await tx.member.update({
              where: { id: referred.id },
              data: { referralRewardedAt: new Date() },
            });
            await tx.notification.create({
              data: {
                memberId: referred.referredById,
                title: 'Giới thiệu thành công — cộng 7 ngày tập!',
                content: `${referred.fullName} đã kích hoạt gói tập qua mã của bạn. Gói tập hiện tại được cộng thêm ${BONUS_DAYS} ngày, hiệu lực đến ${newEndDate.toLocaleDateString('vi-VN')}.`,
                type: 'SYSTEM',
                link: '/member/referral',
              },
            });
          }
        }
      }

      return { payment: updated, membership: activatedMembership };
    });
    await this.auditService.log({
      userId: actor?.id ?? null,
      action: 'PAYMENT_CONFIRM',
      entity: 'Payment',
      entityId: id,
      metadata: {
        code: payment.code,
        amount: payment.amount,
        method: payment.method,
        memberName: payment.member.fullName,
        transactionRef: transactionRef ?? null,
        staffShiftId,
        source: actor ? 'MANUAL' : 'CASSO_AUTO',
      },
    });

    const payerEmail = payment.member.email ?? payment.member.user?.email;

    // Báo tổ quản trị: thanh toán đã xác nhận (tự đối soát CASSO → actor null → báo tất cả)
    await this.notificationsService.notifyAdmins(
      {
        type: 'PAYMENT',
        title: 'Đã xác nhận thanh toán ✅',
        content: `Hóa đơn ${payment.code} — ${payment.member.fullName} (${payment.member.code}) — ${Number(payment.amount).toLocaleString('vi-VN')}đ${
          actor ? ` được xác nhận bởi ${actor.fullName ?? actor.role}` : ' được đối soát tự động qua CASSO'
        }.`,
        link: `/admin/payments/${id}`,
        referenceType: 'PAYMENT_CONFIRMED',
        referenceId: payment.id,
      },
      actor?.id,
    );

    // Hóa đơn qua email — theo dõi kết quả trả về cho admin (invoiceEmailSent):
    // - Đổi gói (packageChange): gửi đồng bộ như trước.
    // - Đăng ký / gia hạn thường: chạy nền qua event nhưng await tối đa 10 giây
    //   để lấy kết quả; quá hạn → null (email vẫn tiếp tục gửi nền, fail chỉ ghi log).
    let invoiceEmailSent: boolean | null = null;
    if (!payerEmail) {
      this.logger.warn(`Không gửi được hóa đơn ${payment.code}: hội viên chưa có email`);
      invoiceEmailSent = false;
    } else if (packageChange) {
      const [invoice, previousMembership] = await Promise.all([
        this.prisma.invoice.findUnique({ where: { paymentId: id } }),
        this.prisma.membership.findUnique({
          where: { id: packageChange[1] },
          include: { package: { select: { name: true } } },
        }),
      ]);
      if (!invoice || !payment.membership || !previousMembership) {
        this.logger.error(`Không gửi được hóa đơn ${payment.code}: thiếu dữ liệu hóa đơn hoặc gói tập`);
      } else {
        const creditText = payment.notes?.match(/giá trị còn lại ([\d.]+) VND/i)?.[1];
        const creditAmount = creditText ? Number(creditText) : Number(invoice.discount);
        const methodLabels: Record<string, string> = {
          CASH: 'Tiền mặt',
          BANK_TRANSFER: 'Chuyển khoản qua QR/CASSO',
          MOMO: 'MoMo',
          VNPAY: 'VNPay',
        };
        try {
          await this.mailService.sendPackageChangeInvoiceEmail({
            email: payerEmail,
            memberName: payment.member.fullName,
            invoiceNumber: invoice.invoiceNumber,
            packageName: payment.membership.package.name,
            amount: Number(invoice.total),
            creditAmount,
            paymentMethod: methodLabels[payment.method] || payment.method,
            paidAt: result.payment.paidAt ?? now,
            transactionRef: result.payment.transactionRef,
            upgradeDescription: `Nâng cấp từ gói ${previousMembership.package.name} sang gói ${payment.membership.package.name}`,
          });
          invoiceEmailSent = true;
        } catch (error) {
          this.logger.error(`Đã xác nhận thanh toán ${payment.code} nhưng không gửi được hóa đơn email`, error instanceof Error ? error.stack : String(error));
        }
      }
    } else {
      // Nhóm B (đăng ký/gia hạn): MailListener sinh PDF + gửi hóa đơn.
      // emitAsync để biết email đã thật sự đi hay không; quá 10s coi như null.
      invoiceEmailSent = await Promise.race([
        this.eventEmitter
          .emitAsync(MAIL_EVENTS.PAYMENT_CONFIRMED, {
            userId: payment.member.id,
            email: payerEmail,
            fullName: payment.member.fullName,
            memberCode: payment.member.code,
            // Ưu tiên số hóa đơn chính thức (INV-...); fallback mã giao dịch
            invoiceNumber: payment.invoice?.invoiceNumber ?? payment.code,
            packageName: payment.membership?.package?.name ?? 'Gói hội viên',
            membershipEndDate: payment.membership?.endDate ?? null,
            amount: Number(payment.amount),
            paidAt: now,
            method: payment.method,
          })
          .then((results) => (typeof results[0] === 'boolean' ? results[0] : null))
          .catch(() => false),
        new Promise<null>((resolve) => {
          const timer = setTimeout(() => resolve(null), 10000);
          timer.unref();
        }),
      ]);
      if (invoiceEmailSent === false) {
        this.logger.error(`Đã xác nhận thanh toán ${payment.code} nhưng không gửi được hóa đơn email`);
      }
    }

    return {
      message: 'Xác nhận thanh toán thành công',
      ...result,
      invoiceEmailSent,
    };
  }

  /**
   * Đối soát tự động với CASSO (Google Apps Script → Google Sheet):
   * - Poll sheet lấy giao dịch mới nhất
   * - Khớp nội dung chuyển khoản `GYM {MEMBER_CODE} {PAYMENT_CODE}` + số tiền
   * - Nếu khớp → gọi confirm() để PENDING → PAID (transaction + hoá đơn + thông báo)
   *
   * Chỉ áp dụng cho BANK_TRANSFER / MOMO (thanh toán qua ví / ngân hàng).
   */
  async verifyCasso(id: string, actor: Actor | null, forceRefresh = false) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { member: { select: { id: true, code: true, fullName: true } } },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    const staffPosMatch = payment.notes?.match(
      /\[STAFF_POS:([0-9a-f-]{36}):([0-9a-f-]{36})\]/i,
    );
    const isStaffPosPayment =
      payment.notes?.includes('[STAFF_POS') ||
      /\[STAFF_POS:[0-9a-f-]{36}(?::[0-9a-f-]{36})?\]/i.test(
        payment.notes ?? '',
      );
    if (isStaffPosPayment && (actor === null || actor.role === Role.MEMBER)) {
      throw new ForbiddenException('Giao dịch tại quầy cần nhân viên xác nhận CASSO khi đang trong ca làm');
    }
    if (isStaffPosPayment && !staffPosMatch) {
      throw new ConflictException('Giao dịch tại quầy chưa được gắn với một ca cụ thể; cần quản lý xử lý');
    }
    if (staffPosMatch) {
      if (actor?.role === Role.STAFF && actor.id.toLowerCase() !== staffPosMatch[1].toLowerCase()) {
        throw new ForbiddenException('Chỉ nhân viên đã tạo giao dịch tại quầy mới có thể đối soát giao dịch này');
      }
      const activeShift = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT TOP (1) CONVERT(nvarchar(36), id) AS id
        FROM dbo.StaffShift
        WHERE staffId = CONVERT(uniqueidentifier, ${staffPosMatch[1]})
          AND id = CONVERT(uniqueidentifier, ${staffPosMatch[2]})
          AND UPPER(status) IN (N'IN_PROGRESS', N'COMPLETED')
          AND startTime <= ${payment.createdAt}
          AND endTime > ${payment.createdAt}
      `);
      if (activeShift.length !== 1) {
        throw new ConflictException('Không tìm thấy ca hợp lệ lúc tạo giao dịch; không thể tự đối soát vào ca khác');
      }
      actor = {
        id: staffPosMatch[1],
        role: Role.STAFF,
        shiftId: staffPosMatch[2],
        cassoSettlement: true,
      };
    }

    if (payment.status !== 'PENDING') {
      if (forceRefresh) await this.cassoService.poll(true);
      return {
        matched: true,
        alreadyPaid: true,
        status: payment.status,
        message: payment.status === 'PAID' ? 'Giao dịch đã được xác nhận thành công trước đó' : `Giao dịch hiện ở trạng thái ${payment.status}`,
      };
    }

    if (payment.method !== 'BANK_TRANSFER' && payment.method !== 'MOMO') {
      throw new BadRequestException('Đối soát tự động chỉ hỗ trợ phương thức Chuyển khoản / MoMo');
    }

    const rows = await this.cassoService.poll(forceRefresh);
    if (!rows.length) {
      return {
        matched: false,
        status: payment.status,
        message: 'Chưa đọc được dữ liệu từ CASSO',
      };
    }

    const match = this.cassoService.findMatch(rows, payment.member.code, payment.code, Number(payment.amount));
    if (!match) {
      return {
        matched: false,
        status: payment.status,
        message: 'Chưa thấy giao dịch tương ứng trên CASSO. Vui lòng thử lại sau vài giây.',
      };
    }

    const transactionRef = match.maGd ? String(match.maGd) : undefined;
    const note = `Đối soát tự động qua CASSO (${match.ngayDienRa || ''})`.trim();

    let confirmed: Awaited<ReturnType<PaymentsService['confirm']>>;
    try {
      confirmed = await this.confirm(id, actor, { transactionRef, note });
    } catch (error) {
      const current = await this.prisma.payment.findUnique({
        where: { id },
        select: { status: true },
      });
      if (current?.status !== PaymentStatus.PAID) throw error;
      return {
        matched: true,
        alreadyPaid: true,
        status: current.status,
        message: 'Giao dịch đã được xác nhận thành công trước đó',
        transactionRef: transactionRef ?? null,
        amount: match.amount ?? null,
      };
    }

    return {
      matched: true,
      status: 'PAID',
      message: 'Thanh toán thành công — đã xác nhận giao dịch từ CASSO',
      transactionRef: transactionRef ?? null,
      amount: match.amount ?? null,
      confirmed,
    };
  }

  /**
   * Từ chối / hủy hóa đơn đang chờ (PENDING → CANCELLED):
   * Membership PENDING → CANCELLED, Invoice ISSUED → CANCELLED, thông báo member.
   */
  async reject(id: string, actor: Actor, dto: RejectPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        membership: { include: { package: true } },
        member: { select: { id: true, code: true, fullName: true } },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Chỉ hóa đơn đang chờ (PENDING) mới có thể từ chối/hủy');
    }

    const reason = dto.reason?.trim() || '';
    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.CANCELLED,
          confirmedById: actor.id,
          confirmedAt: now,
          ...(reason
            ? {
                notes: [payment.notes, `Lý do: ${reason}`].filter(Boolean).join(' | '),
              }
            : {}),
        },
      });

      let cancelledMembership = null;
      if (payment.membership && payment.membership.status === 'PENDING') {
        cancelledMembership = await tx.membership.update({
          where: { id: payment.membership.id },
          data: { status: 'CANCELLED' },
        });
      }

      await tx.invoice.updateMany({
        where: { paymentId: id, status: InvoiceStatus.ISSUED },
        data: { status: InvoiceStatus.CANCELLED },
      });

      await tx.notification.create({
        data: {
          memberId: payment.member.id,
          title: 'Thanh toán chưa được xác nhận ⚠️',
          content: `Hóa đơn ${payment.code} đã bị từ chối. ${reason ? `Lý do: ${reason}` : 'Vui lòng liên hệ lễ tân phòng tập để được hỗ trợ.'}`,
          type: 'PAYMENT',
          link: '/member/payments',
          referenceType: 'PAYMENT_REJECTED',
          referenceId: payment.id,
        },
      });

      return { payment: updated, membership: cancelledMembership };
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'PAYMENT_REJECT',
      entity: 'Payment',
      entityId: id,
      metadata: {
        code: payment.code,
        amount: payment.amount,
        reason: reason ?? null,
        memberName: payment.member.fullName,
      },
    });

    // Báo tổ quản trị: hóa đơn bị từ chối/hủy (loại người vừa thao tác)
    await this.notificationsService.notifyAdmins(
      {
        type: 'PAYMENT',
        title: 'Hóa đơn đã bị từ chối/hủy ⚠️',
        content: `Hóa đơn ${payment.code} — ${payment.member.fullName} (${payment.member.code}) — ${Number(payment.amount).toLocaleString('vi-VN')}đ đã bị từ chối${reason ? ` (${reason})` : ''}.`,
        link: `/admin/payments/${id}`,
        referenceType: 'PAYMENT_REJECTED',
        referenceId: payment.id,
      },
      actor.id,
    );

    return { message: 'Đã hủy/từ chối hóa đơn', ...result };
  }

  /** Back-compat: PATCH /payments/:id/cancel */
  async cancel(id: string, actor: Actor) {
    return this.reject(id, actor, { reason: 'Hủy bởi lễ tân/quản trị' });
  }

  /**
   * Hoàn tiền (PAID → REFUNDED) — chỉ ADMIN.
   * Không tính REFUNDED vào doanh thu thực nhận; Invoice bị đóng lại.
   */
  async refund(id: string, actor: Actor, dto: RefundPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        membership: { include: { package: true } },
        member: { select: { id: true, code: true, fullName: true } },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status !== 'PAID') {
      throw new BadRequestException('Chỉ giao dịch đã thanh toán (PAID) mới hoàn tiền được');
    }

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REFUNDED,
          confirmedById: actor.id,
          confirmedAt: now,
          notes: [payment.notes, dto.reason ? `Hoàn tiền: ${dto.reason}` : 'Hoàn tiền'].filter(Boolean).join(' | '),
        },
      });

      await tx.invoice.updateMany({
        where: { paymentId: id, status: InvoiceStatus.PAID },
        data: { status: InvoiceStatus.CANCELLED },
      });

      // Legacy sync: hoàn tiền → giảm usedCount của promo (không bị âm)
      if (payment.promotionId) {
        await tx.promotion.updateMany({
          where: { id: payment.promotionId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      let cancelledMembership = null;
      if (dto.deactivateMembership && payment.membership && payment.membership.status === 'ACTIVE') {
        cancelledMembership = await tx.membership.update({
          where: { id: payment.membership.id },
          data: { status: 'CANCELLED' },
        });
      }

      await tx.notification.create({
        data: {
          memberId: payment.member.id,
          title: 'Đã hoàn tiền 💸',
          content: `Hóa đơn ${payment.code} (${payment.membership?.package?.name || ''}) đã được hoàn tiền. ${dto.reason ? 'Lý do: ' + dto.reason : ''}`,
          type: 'PAYMENT',
          link: '/member/payments',
          referenceType: 'PAYMENT_REFUNDED',
          referenceId: payment.id,
        },
      });

      return { payment: updated, membership: cancelledMembership };
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'PAYMENT_REFUND',
      entity: 'Payment',
      entityId: id,
      metadata: {
        code: payment.code,
        amount: payment.amount,
        reason: dto.reason ?? null,
        deactivateMembership: dto.deactivateMembership ?? false,
        memberName: payment.member.fullName,
      },
    });

    // Báo tổ quản trị: giao dịch đã hoàn tiền (loại người vừa thao tác)
    await this.notificationsService.notifyAdmins(
      {
        type: 'PAYMENT',
        title: 'Đã hoàn tiền giao dịch 💸',
        content: `Hóa đơn ${payment.code} — ${payment.member.fullName} (${payment.member.code}) — ${Number(payment.amount).toLocaleString('vi-VN')}đ đã được hoàn tiền${dto.reason ? ` (${dto.reason})` : ''}.`,
        link: `/admin/payments/${id}`,
        referenceType: 'PAYMENT_REFUNDED',
        referenceId: payment.id,
      },
      actor.id,
    );

    return { message: 'Đã hoàn tiền', ...result };
  }

  /** Thông tin tài khoản nhận tiền (BANK_TRANSFER) + danh sách gateway */
  getBankInfo() {
    return {
      ...BANK_INFO,
      gateways: this.gatewayService.listGateways(),
    };
  }
}
