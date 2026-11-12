import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InvoiceStatus, PaymentStatus } from "../../common/constants/db-enums";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PaymentsService } from "../payments/payments.service";
import { UpdateMembershipStatusDto } from "./dto/update-membership-status.dto";
import { ExtendMembershipDto } from "./dto/extend-membership.dto";
import { CreateCancelRequestDto } from "./dto/create-cancel-request.dto";
import { ApproveCancelRequestDto } from "./dto/approve-cancel-request.dto";
import { RejectCancelRequestDto } from "./dto/reject-cancel-request.dto";

@Injectable()
export class MembershipsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private paymentsService: PaymentsService,
  ) {}

  async findAll() {
    return this.prisma.membership.findMany({
      include: {
        member: {
          select: { id: true, code: true, fullName: true, phone: true },
        },
        package: {
          select: { id: true, name: true, durationDays: true, price: true },
        },
        payments: {
          select: {
            id: true,
            code: true,
            amount: true,
            method: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: true,
        package: true,
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!membership)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");
    return membership;
  }

  /**
   * Cập nhật trạng thái membership:
   * - SUSPENDED: tạm khóa thẻ (chỉ từ ACTIVE)
   * - ACTIVE: kích hoạt lại (chỉ từ SUSPENDED hoặc PENDING khi đã thanh toán)
   * - CANCELLED: hủy hợp đồng (hủy kèm payment PENDING nếu có)
   * - EXPIRED: đánh dấu hết hạn
   */
  async updateStatus(
    id: string,
    dto: UpdateMembershipStatusDto,
    actorId?: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, fullName: true } },
        package: { select: { id: true, name: true } },
      },
    });
    if (!membership)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

    const next = dto.status;
    const cur = membership.status;

    if (next === "SUSPENDED" && cur !== "ACTIVE") {
      throw new ConflictException(
        "Chỉ có thể tạm khóa thẻ đang hoạt động (ACTIVE)",
      );
    }
    if (next === "ACTIVE" && cur === "PENDING") {
      // Kích hoạt gói đang chờ thanh toán → chỉ khi có payment đã PAID
      const paidPayment = await this.prisma.payment.findFirst({
        where: { membershipId: id, status: "PAID" },
      });
      if (!paidPayment) {
        throw new ConflictException(
          "Chưa có khoản thanh toán được xác nhận cho gói này",
        );
      }
    }
    if (next === "CANCELLED" && (cur === "CANCELLED" || cur === "EXPIRED")) {
      throw new ConflictException("Hợp đồng đã ở trạng thái này");
    }
    if (next === "CANCELLED" && cur === "PENDING") {
      const pendingPayment = await this.prisma.payment.findFirst({
        where: { membershipId: id, status: "PENDING" },
        select: { id: true },
      });
      if (pendingPayment) {
        throw new ConflictException(
          "Gói đang có khoản thanh toán chờ xác nhận. Hãy xác nhận hoặc từ chối khoản thanh toán trước.",
        );
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id },
        data: { status: next },
      });

      // Hủy đăng ký → hủy luôn hóa đơn đang PENDING
      if (next === "CANCELLED") {
        await tx.payment.updateMany({
          where: { membershipId: id, status: "PENDING" },
          data: {
            status: "CANCELLED",
            notes: "Hủy theo yêu cầu quản trị viên",
          },
        });
      }

      const notificationContentMap: Record<string, string> = {
        SUSPENDED: `Thẻ tập gói ${membership.package.name} của bạn đã bị tạm khóa${dto.reason ? ` (Lý do: ${dto.reason})` : ""}. Liên hệ lễ tân để biết thêm chi tiết.`,
        ACTIVE: `Gói tập ${membership.package.name} của bạn đã được kích hoạt lại.`,
        CANCELLED: `Hợp đồng gói ${membership.package.name} của bạn đã bị hủy${dto.reason ? ` (Lý do: ${dto.reason})` : ""}.`,
        EXPIRED: `Gói tập ${membership.package.name} của bạn đã hết hạn. Gia hạn ngay để tiếp tục tập luyện!`,
        PENDING: "",
      };

      const titleMap: Record<string, string> = {
        SUSPENDED: "Thẻ tập bị tạm khóa ⛔",
        ACTIVE: "Gói tập đã được kích hoạt ✅",
        CANCELLED: "Hợp đồng đã bị hủy 🗑️",
        EXPIRED: "Gói tập đã hết hạn ⚠️",
        PENDING: "",
      };

      if (notificationContentMap[next]) {
        await tx.notification.create({
          data: {
            memberId: membership.member.id,
            title: titleMap[next],
            content: notificationContentMap[next],
            type: "MEMBERSHIP",
            link: "/member/membership",
          },
        });
      }

      return updated;
    });

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_STATUS_CHANGE",
      entity: "Membership",
      entityId: id,
      metadata: {
        from: cur,
        to: next,
        reason: dto.reason ?? null,
        memberName: membership.member.fullName,
      },
    });

    // Báo tổ quản trị: gói tập đổi trạng thái (loại người vừa thao tác)
    await this.notificationsService.notifyAdmins(
      {
        type: "MEMBERSHIP",
        title: `Gói tập chuyển trạng thái: ${next} ⚠️`,
        content: `Gói ${membership.package.name} của hội viên ${membership.member.fullName} chuyển từ ${cur} sang ${next}${dto.reason ? ` — lý do: ${dto.reason}` : ""}.`,
        link: "/admin/memberships",
      },
      actorId,
    );

    return {
      message: `Đã cập nhật trạng thái thành ${next}`,
      membership: result,
    };
  }

  /**
   * Hội viên gửi yêu cầu hủy gói đang hoạt động — chờ admin xét duyệt.
   * Chỉ ghi yêu cầu; gói vẫn ACTIVE cho tới khi admin quyết định (duyệt / từ chối).
   */
  async createCancelRequest(
    userId: string,
    membershipId: string,
    dto: CreateCancelRequestDto,
  ) {
    const member = await this.prisma.member.findUnique({ where: { userId } });
    if (!member)
      throw new ForbiddenException(
        "Chỉ hội viên mới có thể gửi yêu cầu hủy gói",
      );

    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { package: { select: { name: true } } },
    });
    if (!membership || membership.memberId !== member.id) {
      throw new NotFoundException("Không tìm thấy gói tập của bạn");
    }
    if (membership.status !== "ACTIVE") {
      throw new ConflictException(
        "Chỉ có thể yêu cầu hủy gói đang hoạt động (ACTIVE)",
      );
    }
    if (membership.cancelRequestedAt) {
      throw new ConflictException(
        "Bạn đã gửi yêu cầu hủy gói — đang chờ quản trị viên xét duyệt",
      );
    }

    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: {
        cancelRequestedAt: new Date(),
        cancelRequestReason: dto.reason ?? null,
      },
    });

    await this.auditService.log({
      userId,
      action: "MEMBERSHIP_CANCEL_REQUESTED",
      entity: "Membership",
      entityId: membershipId,
      metadata: {
        memberName: member.fullName,
        package: membership.package.name,
        reason: dto.reason ?? null,
      },
    });

    // Báo tổ quản trị: có yêu cầu hủy gói chờ xét duyệt (loại hội viên vừa gửi)
    await this.notificationsService.notifyAdmins(
      {
        type: "MEMBERSHIP",
        title: "Yêu cầu hủy gói mới 🙋",
        content: `Hội viên ${member.fullName} (${member.code}) gửi yêu cầu hủy gói ${membership.package.name}${dto.reason ? ` — lý do: ${dto.reason}` : ""}. Vào /admin/memberships để xét duyệt.`,
        link: "/admin/memberships",
        referenceType: "MEMBERSHIP_CANCEL_REQUESTED",
        referenceId: membershipId,
      },
      userId,
    );

    return {
      message:
        "Đã gửi yêu cầu hủy gói — quản trị viên sẽ xét duyệt và thông báo kết quả (bao gồm quyết định hoàn tiền)",
      membership: updated,
    };
  }

  /**
   * Admin duyệt yêu cầu hủy gói: hủy gói + (tuỳ chọn) hoàn tiền.
   * Hoàn tiền > 0 chỉ ADMIN — MANAGER/STAFF chỉ hủy không hoàn.
   */
  async approveCancelRequest(
    id: string,
    dto: ApproveCancelRequestDto,
    role: string,
    actorId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, code: true, fullName: true } },
        package: { select: { name: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!membership)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");
    if (!membership.cancelRequestedAt) {
      throw new ConflictException(
        "Không có yêu cầu hủy gói nào đang chờ xét duyệt",
      );
    }
    if (membership.status !== "ACTIVE") {
      throw new ConflictException("Gói tập không còn ở trạng thái hoạt động");
    }

    const refundAmount = dto.refundAmount ?? 0;
    const refundMethod = dto.refundMethod ?? "BANK_TRANSFER";

    // Tìm giao dịch đã thanh toán (mới nhất) để hoàn tiền
    let paidPayment: (typeof membership.payments)[number] | null = null;
    if (refundAmount > 0) {
      if (role !== "ADMIN") {
        throw new ForbiddenException(
          "Chỉ quản trị viên mới được duyệt hoàn tiền",
        );
      }
      paidPayment =
        membership.payments.find((p) => p.status === "PAID") ?? null;
      if (!paidPayment) {
        throw new ConflictException(
          "Không có giao dịch đã thanh toán để hoàn tiền",
        );
      }
      if (refundAmount > Number(paidPayment.amount)) {
        throw new BadRequestException(
          `Số tiền hoàn không được vượt quá ${Number(paidPayment.amount).toLocaleString("vi-VN")}đ`,
        );
      }
    }

    const reason =
      dto.reason ??
      membership.cancelRequestReason ??
      "Hủy gói theo yêu cầu hội viên";

    let updatedMembership;
    if (refundAmount > 0 && paidPayment) {
      const refundResult = await this.paymentsService.refund(
        paidPayment.id,
        { id: actorId, role },
        { reason, refundAmount, refundMethod, deactivateMembership: true },
      );
      if (!refundResult.membership) {
        throw new ConflictException(
          "Không thể hủy gói cùng lúc với giao dịch hoàn tiền",
        );
      }
      updatedMembership = refundResult.membership;
    } else {
      // Hủy gói không hoàn tiền.
      const result = await this.updateStatus(
        id,
        { status: "CANCELLED", reason },
        actorId,
      );
      updatedMembership = result.membership;

      // Xóa dấu vết yêu cầu để tránh badge/banner cũ hiện lại nếu kích hoạt lại gói.
      await this.prisma.membership.update({
        where: { id },
        data: { cancelRequestedAt: null, cancelRequestReason: null },
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_CANCEL_APPROVED",
      entity: "Membership",
      entityId: id,
      metadata: {
        memberName: membership.member.fullName,
        package: membership.package.name,
        refundAmount,
        refundMethod: refundAmount > 0 ? refundMethod : null,
        paymentCode: paidPayment?.code ?? null,
        reason,
      },
    });

    return {
      message:
        refundAmount > 0
          ? `Đã hủy gói và hoàn ${refundAmount.toLocaleString("vi-VN")}đ qua ${refundMethod === "CASH" ? "tiền mặt" : "chuyển khoản"}`
          : "Đã hủy gói theo yêu cầu hội viên (không hoàn tiền)",
      membership: updatedMembership,
      refunded: refundAmount > 0,
      refundAmount,
    };
  }

  /** Admin từ chối yêu cầu hủy gói — gói tiếp tục hoạt động bình thường */
  async rejectCancelRequest(
    id: string,
    dto: RejectCancelRequestDto,
    actorId: string,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, code: true, fullName: true } },
        package: { select: { name: true } },
      },
    });
    if (!membership)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");
    if (!membership.cancelRequestedAt) {
      throw new ConflictException(
        "Không có yêu cầu hủy gói nào đang chờ xét duyệt",
      );
    }

    const updated = await this.prisma.membership.update({
      where: { id },
      data: { cancelRequestedAt: null, cancelRequestReason: null },
    });

    await this.prisma.notification.create({
      data: {
        memberId: membership.member.id,
        title: "Yêu cầu hủy gói bị từ chối ❌",
        content: `Yêu cầu hủy gói ${membership.package.name} của bạn không được chấp thuận${dto.reason ? ` (Lý do: ${dto.reason})` : ""}. Gói tập tiếp tục hoạt động bình thường — liên hệ lễ tân nếu cần hỗ trợ thêm.`,
        type: "MEMBERSHIP",
        link: "/member/membership",
      },
    });

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_CANCEL_REJECTED",
      entity: "Membership",
      entityId: id,
      metadata: {
        memberName: membership.member.fullName,
        package: membership.package.name,
        reason: dto.reason ?? null,
      },
    });

    // Báo tổ quản trị: yêu cầu hủy đã bị từ chối (loại người vừa thao tác)
    await this.notificationsService.notifyAdmins(
      {
        type: "MEMBERSHIP",
        title: "Đã từ chối yêu cầu hủy gói ❌",
        content: `Yêu cầu hủy gói ${membership.package.name} của ${membership.member.fullName} (${membership.member.code}) đã bị từ chối${dto.reason ? ` — lý do: ${dto.reason}` : ""}.`,
        link: "/admin/memberships",
        referenceType: "MEMBERSHIP_CANCEL_REJECTED",
        referenceId: membership.id,
      },
      actorId,
    );

    return { message: "Đã từ chối yêu cầu hủy gói", membership: updated };
  }

  /** Admin gia hạn thêm N ngày + tạo Payment PENDING (chờ thu tiền) */
  async extend(id: string, dto: ExtendMembershipDto, actorId?: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        member: { select: { id: true, code: true, fullName: true } },
        package: { select: { id: true, name: true, price: true } },
      },
    });
    if (!membership)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

    if (membership.status === "EXPIRED" || membership.status === "CANCELLED") {
      throw new ConflictException("Không thể gia hạn hợp đồng đã kết thúc");
    }

    const newEndDate = new Date(
      membership.endDate.getTime() + dto.days * 24 * 60 * 60 * 1000,
    );

    const code = await this.genPaymentCode();
    let createdPaymentId = "";

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id },
        data: {
          endDate: newEndDate,
          // Kéo status ACTIVE trở lại nếu đang ở PENDING/không có hiệu lực
          status:
            membership.status === "PENDING" ? "ACTIVE" : membership.status,
        },
      });

      const createdPayment = await tx.payment.create({
        data: {
          code,
          memberId: membership.member.id,
          membershipId: id,
          amount: membership.package.price,
          method: "CASH",
          status: PaymentStatus.PENDING,
          notes: `Gia hạn bởi quản trị viên (+${dto.days} ngày)${dto.reason ? ` - ${dto.reason}` : ""}`,
        },
      });
      createdPaymentId = createdPayment.id;

      // Hóa đơn đi kèm (1-1 với payment)
      await tx.invoice.create({
        data: {
          invoiceNumber: code,
          memberId: membership.member.id,
          membershipId: id,
          paymentId: createdPayment.id,
          subtotal: membership.package.price,
          discount: 0,
          total: membership.package.price,
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
          dueDate: new Date(newEndDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.notification.create({
        data: {
          memberId: membership.member.id,
          title: "Gói tập được gia hạn bởi lễ tân 🔄",
          content: `Lễ tân đã gia hạn thêm ${dto.days} ngày cho gói ${membership.package.name}. Hạn sử dụng mới: ${newEndDate.toLocaleDateString("vi-VN")}. Vui lòng đến quầy thu ngân để thanh toán.`,
          type: "MEMBERSHIP",
          link: "/member/membership",
        },
      });

      return updated;
    });

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_EXTEND",
      entity: "Membership",
      entityId: id,
      metadata: {
        days: dto.days,
        newEndDate: newEndDate.toISOString(),
        paymentCode: code,
        reason: dto.reason ?? null,
      },
    });

    // Báo tổ quản trị: có payment PENDING phát sinh từ gia hạn tại quầy (loại người vừa tạo)
    await this.notificationsService.notifyAdmins(
      {
        type: "PAYMENT",
        title: "Cần thu tiền gia hạn gói 💳",
        content: `Lễ tân đã gia hạn +${dto.days} ngày cho hội viên ${membership.member.fullName} (${membership.member.code}) — gói ${membership.package.name}, mã ${code}, số tiền ${Number(membership.package.price).toLocaleString("vi-VN")}đ chờ thu. Vào /admin/payments để xác nhận.`,
        link: "/admin/payments",
        referenceType: "PAYMENT_REQUEST",
        referenceId: createdPaymentId,
      },
      actorId,
    );

    return {
      message: `Đã gia hạn thêm ${dto.days} ngày (hạn mới: ${newEndDate.toLocaleDateString("vi-VN")})`,
      membership: result,
    };
  }

  private async genPaymentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const last = await this.prisma.payment.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    let seq = last ? parseInt(last.code.slice(prefix.length), 10) || 0 : 0;
    for (let i = 0; i < 500; i++) {
      seq += 1;
      const code = `${prefix}${String(seq).padStart(4, "0")}`;
      const pay = await this.prisma.payment.findUnique({
        where: { code },
        select: { id: true },
      });
      const inv = await this.prisma.invoice.findUnique({
        where: { invoiceNumber: code },
        select: { id: true },
      });
      if (!pay && !inv) return code;
    }
    return `${prefix}${Date.now()}`;
  }
}
