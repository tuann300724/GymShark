import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit-logs/audit-logs.service";
import { Role } from "../../common/enums/role.enum";
import { PaymentGatewayService } from "./gateway/payment-gateway.service";
import { ConfirmPaymentDto } from "./dto/confirm-payment.dto";
import { RejectPaymentDto } from "./dto/reject-payment.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { PaymentListQueryDto } from "./dto/payment-list-query.dto";
import { BANK_INFO } from "./bank-info";
import {
  PaymentDetailRow,
  PaymentListRow,
  PaymentsRepository,
} from "./repository/payments.repository";
import { PAYMENTS_REPOSITORY } from "./repository/payments.tokens";

interface Actor {
  id: string;
  role: string;
  fullName?: string;
}

function parseJson(v: unknown) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
}

function num(v: string | number | null | undefined) {
  if (v == null) return null;
  return Number(v);
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENTS_REPOSITORY) private readonly repo: PaymentsRepository,
    private gatewayService: PaymentGatewayService,
    private auditService: AuditService,
  ) {}

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }

  private shapeListRow(r: PaymentListRow) {
    return {
      id: r.id,
      code: r.code,
      memberId: r.memberId,
      membershipId: r.membershipId,
      promotionId: r.promotionId,
      amount: num(r.amount),
      discountAmount: num(r.discountAmount),
      currency: r.currency,
      method: r.method,
      status: r.status,
      transactionRef: r.transactionRef,
      notes: r.notes,
      confirmedById: r.confirmedById,
      confirmedAt: r.confirmedAt,
      paidAt: r.paidAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      member: r.member_id
        ? {
            id: r.member_id,
            code: r.member_code,
            fullName: r.member_fullName,
            email: r.member_email,
            phone: r.member_phone,
          }
        : null,
      membership: r.membership_id
        ? {
            id: r.membership_id,
            package: r.package_id
              ? { id: r.package_id, name: r.package_name }
              : null,
          }
        : null,
      promotion: r.promotion_id
        ? { id: r.promotion_id, code: r.promotion_code, name: r.promotion_name }
        : null,
      invoice: r.invoice_id
        ? {
            id: r.invoice_id,
            invoiceNumber: r.invoiceNumber,
            status: r.invoice_status,
          }
        : null,
      confirmedBy: r.confirmedBy_id
        ? { id: r.confirmedBy_id, fullName: r.confirmedBy_fullName }
        : null,
    };
  }

  private shapeDetailRow(r: PaymentDetailRow) {
    const invoice = r.invoice_id
      ? {
          id: r.invoice_id,
          invoiceNumber: r.invoiceNumber,
          memberId: r.invoice_memberId,
          membershipId: r.invoice_membershipId,
          paymentId: r.invoice_paymentId,
          subtotal: num(r.invoice_subtotal),
          discount: num(r.invoice_discount),
          total: num(r.invoice_total),
          status: r.invoice_status,
          issuedAt: r.invoice_issuedAt,
          dueDate: r.invoice_dueDate,
          createdAt: r.invoice_createdAt,
        }
      : null;

    return {
      id: r.id,
      code: r.code,
      memberId: r.memberId,
      membershipId: r.membershipId,
      promotionId: r.promotionId,
      amount: num(r.amount),
      discountAmount: num(r.discountAmount),
      currency: r.currency,
      method: r.method,
      status: r.status,
      transactionRef: r.transactionRef,
      notes: r.notes,
      confirmedById: r.confirmedById,
      confirmedAt: r.confirmedAt,
      paidAt: r.paidAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      member: r.member_id
        ? {
            id: r.member_id,
            code: r.member_code,
            fullName: r.member_fullName,
            email: r.member_email,
            phone: r.member_phone,
            address: r.member_address,
            gender: r.member_gender,
            joinedAt: r.member_joinedAt,
            branch: r.branch_id
              ? { id: r.branch_id, name: r.branch_name, code: r.branch_code }
              : null,
          }
        : null,
      membership: r.membership_id
        ? {
            id: r.membership_id,
            startDate: r.membership_startDate,
            endDate: r.membership_endDate,
            status: r.membership_status,
            price: num(r.membership_price),
            package: r.package_id
              ? {
                  id: r.package_id,
                  name: r.package_name,
                  durationDays: r.package_durationDays,
                  price: num(r.package_price),
                  description: r.package_description,
                  type: r.package_type,
                }
              : null,
          }
        : null,
      promotion: r.promotion_id
        ? {
            id: r.promotion_id,
            code: r.promotion_code,
            name: r.promotion_name,
            discountType: r.promotion_discountType,
            discountValue: num(r.promotion_discountValue),
          }
        : null,
      invoice,
      confirmedBy: r.confirmedBy_id
        ? {
            id: r.confirmedBy_id,
            fullName: r.confirmedBy_fullName,
            role: r.confirmedBy_role,
          }
        : null,
    };
  }

  /**
   * Danh sách thanh toán (admin) + thống kê dashboard.
   */
  async findAll(query: PaymentListQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    let from: string | undefined;
    let to: string | undefined;
    if (query.from) from = new Date(query.from).toISOString();
    if (query.to) to = this.endOfDay(new Date(query.to)).toISOString();

    const [{ data, total }, stats] = await Promise.all([
      this.repo.list({
        page,
        limit,
        status: query.status as string | undefined,
        method: query.method as string | undefined,
        memberId: query.memberId,
        packageId: query.packageId,
        from,
        to,
        search: query.search,
      }),
      this.repo.stats(),
    ]);

    return {
      data: data.map((r) => this.shapeListRow(r)),
      total,
      page,
      limit,
      stats: {
        totalRevenue: num(stats.totalRevenue) || 0,
        revenueToday: num(stats.revenueToday) || 0,
        pendingCount: Number(stats.pendingCount || 0),
        paidCount: Number(stats.paidCount || 0),
        failedCount: Number(stats.failedCount || 0),
        cancelledCount: Number(stats.cancelledCount || 0),
        refundedCount: Number(stats.refundedCount || 0),
        refundedTotal: num(stats.refundedTotal) || 0,
      },
    };
  }

  async findOne(id: string) {
    const payment = await this.repo.findOne(id);
    if (!payment)
      throw new NotFoundException("Không tìm thấy giao dịch thanh toán");
    return this.shapeDetailRow(payment);
  }

  /**
   * Xác nhận thanh toán (PENDING → PAID).
   */
  async confirm(id: string, actor: Actor, dto: ConfirmPaymentDto) {
    const payment = await this.repo.findByIdWithMembership(id);
    if (!payment)
      throw new NotFoundException("Không tìm thấy giao dịch thanh toán");

    if ((payment as any).status !== "PENDING") {
      throw new BadRequestException(
        "Chỉ hóa đơn đang chờ (PENDING) mới có thể xác nhận",
      );
    }

    const method = (payment as any).method as string;
    const gateway = this.gatewayService.getGateway(method as any);
    if (actor.role === Role.STAFF && !gateway.manualConfirmation) {
      throw new ForbiddenException(
        "Nhân viên chỉ xác nhận được thanh toán Tiền mặt / Chuyển khoản",
      );
    }

    const transactionRef = dto.transactionRef?.trim();
    if (transactionRef) {
      const dup = await this.repo.findByTransactionRef(transactionRef, id);
      if (dup) {
        throw new ConflictException(
          `Mã giao dịch "${transactionRef}" đã được dùng cho hóa đơn ${dup.code}. Vui lòng kiểm tra lại.`,
        );
      }
    }

    const result = await this.repo.confirm({
      id,
      actorId: actor.id,
      transactionRef: transactionRef ?? null,
      note: dto.note ?? null,
    });

    await this.auditService.log({
      userId: actor.id,
      action: "PAYMENT_CONFIRM",
      entity: "Payment",
      entityId: id,
      metadata: {
        code: (payment as any).code,
        amount: (payment as any).amount,
        method,
        memberName: (payment as any).member_fullName,
        transactionRef: transactionRef ?? null,
      },
    });

    return {
      message: "Xác nhận thanh toán thành công",
      payment: result.payment,
      membership: result.membership,
    };
  }

  /**
   * Từ chối / hủy hóa đơn đang chờ (PENDING → CANCELLED).
   */
  async reject(id: string, actor: Actor, dto: RejectPaymentDto) {
    const payment = await this.repo.findByIdWithMembership(id);
    if (!payment)
      throw new NotFoundException("Không tìm thấy giao dịch thanh toán");
    if ((payment as any).status !== "PENDING") {
      throw new BadRequestException(
        "Chỉ hóa đơn đang chờ (PENDING) mới có thể từ chối/hủy",
      );
    }

    const reason = dto.reason?.trim() || "";
    const result = await this.repo.reject({ id, actorId: actor.id, reason });

    await this.auditService.log({
      userId: actor.id,
      action: "PAYMENT_REJECT",
      entity: "Payment",
      entityId: id,
      metadata: {
        code: (payment as any).code,
        amount: (payment as any).amount,
        reason: reason || null,
        memberName: (payment as any).member_fullName,
      },
    });

    return { message: "Đã hủy/từ chối hóa đơn", ...result };
  }

  /** Back-compat: PATCH /payments/:id/cancel */
  async cancel(id: string, actor: Actor) {
    return this.reject(id, actor, { reason: "Hủy bởi lễ tân/quản trị" });
  }

  /**
   * Hoàn tiền (PAID → REFUNDED) — chỉ ADMIN.
   */
  async refund(id: string, actor: Actor, dto: RefundPaymentDto) {
    const payment = await this.repo.findByIdWithMembership(id);
    if (!payment)
      throw new NotFoundException("Không tìm thấy giao dịch thanh toán");
    if ((payment as any).status !== "PAID") {
      throw new BadRequestException(
        "Chỉ giao dịch đã thanh toán (PAID) mới hoàn tiền được",
      );
    }

    const result = await this.repo.refund({
      id,
      actorId: actor.id,
      reason: dto.reason ?? null,
      deactivateMembership: !!dto.deactivateMembership,
    });

    await this.auditService.log({
      userId: actor.id,
      action: "PAYMENT_REFUND",
      entity: "Payment",
      entityId: id,
      metadata: {
        code: (payment as any).code,
        amount: (payment as any).amount,
        reason: dto.reason ?? null,
        deactivateMembership: dto.deactivateMembership ?? false,
        memberName: (payment as any).member_fullName,
      },
    });

    return { message: "Đã hoàn tiền", ...result };
  }

  /** Thông tin tài khoản nhận tiền (BANK_TRANSFER) + danh sách gateway */
  getBankInfo() {
    return {
      ...BANK_INFO,
      gateways: this.gatewayService.listGateways(),
    };
  }
}
