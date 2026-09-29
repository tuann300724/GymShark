import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { Role } from '../../common/enums/role.enum';
import { PaymentGatewayService } from './gateway/payment-gateway.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentListQueryDto } from './dto/payment-list-query.dto';
import { BANK_INFO } from './bank-info';

interface Actor {
  id: string;
  role: string;
  fullName?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gatewayService: PaymentGatewayService,
    private auditService: AuditService,
  ) {}

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
        { code: { contains: q, mode: 'insensitive' } },
        { transactionRef: { contains: q, mode: 'insensitive' } },
        { member: { fullName: { contains: q, mode: 'insensitive' } } },
        { member: { email: { contains: q, mode: 'insensitive' } } },
        { member: { phone: { contains: q, mode: 'insensitive' } } },
        { member: { code: { contains: q, mode: 'insensitive' } } },
        { invoice: { invoiceNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [data, total, paidAgg, revenueTodayAgg, pendingCount, paidCount, failedCount, cancelledCount, refundedAgg] =
      await Promise.all([
        this.prisma.payment.findMany({
          where,
          include: {
            member: { select: { id: true, code: true, fullName: true, email: true, phone: true } },
            membership: { include: { package: { select: { id: true, name: true } } } },
            promotion: { select: { id: true, code: true, name: true } },
            invoice: { select: { id: true, invoiceNumber: true, status: true } },
            confirmedBy: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.payment.count({ where }),
        this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
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
            branch: { select: { id: true, name: true, code: true } },
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
  async confirm(id: string, actor: Actor, dto: ConfirmPaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        membership: { include: { package: true } },
        member: { select: { id: true, code: true, fullName: true } },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Chỉ hóa đơn đang chờ (PENDING) mới có thể xác nhận');
    }

    // STAFF chỉ xác nhận được phương thức xác nhận thủ công (CASH / BANK_TRANSFER)
    const gateway = this.gatewayService.getGateway(payment.method as Exclude<PaymentMethod, 'CREDIT_CARD'>);
    if (actor.role === Role.STAFF && !gateway.manualConfirmation) {
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
        throw new ConflictException(
          `Mã giao dịch "${transactionRef}" đã được dùng cho hóa đơn ${dup.code}. Vui lòng kiểm tra lại.`,
        );
      }
    }

    const now = new Date();
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          confirmedById: actor.id,
          confirmedAt: now,
          ...(transactionRef ? { transactionRef } : {}),
          ...(dto.note ? { notes: [payment.notes, dto.note].filter(Boolean).join(' | ') } : {}),
        },
      });

      if (payment.promotionId) {
        await tx.promotion.update({
          where: { id: payment.promotionId },
          data: { usedCount: { increment: 1 } },
        });
      }

      let activatedMembership = null;
      if (payment.membership && payment.membership.status === 'PENDING') {
        activatedMembership = await tx.membership.update({
          where: { id: payment.membership.id },
          data: { status: 'ACTIVE' },
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
            activatedMembership
              ? `Gói tập của bạn đã được kích hoạt và có hiệu lực đến ${activatedMembership.endDate.toLocaleDateString('vi-VN')}.`
              : ''
          }`,
          type: 'PAYMENT',
          link: '/member/payments',
          referenceType: 'PAYMENT_CONFIRMED',
          referenceId: payment.id,
        },
      });

      return { payment: updated, membership: activatedMembership };
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'PAYMENT_CONFIRM',
      entity: 'Payment',
      entityId: id,
      metadata: {
        code: payment.code,
        amount: payment.amount,
        method: payment.method,
        memberName: payment.member.fullName,
        transactionRef: transactionRef ?? null,
      },
    });

    return { message: 'Xác nhận thanh toán thành công', ...result };
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
        member: { select: { id: true, fullName: true } },
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
            ? { notes: [payment.notes, `Lý do: ${reason}`].filter(Boolean).join(' | ') }
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
          content: `Hóa đơn ${payment.code} đã bị từ chối. ${
            reason ? `Lý do: ${reason}` : 'Vui lòng liên hệ lễ tân phòng tập để được hỗ trợ.'
          }`,
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
      metadata: { code: payment.code, amount: payment.amount, reason: reason ?? null, memberName: payment.member.fullName },
    });

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
        member: { select: { id: true, fullName: true } },
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
          content: `Hóa đơn ${payment.code} (${
            payment.membership?.package?.name || ''
          }) đã được hoàn tiền. ${dto.reason ? 'Lý do: ' + dto.reason : ''}`,
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