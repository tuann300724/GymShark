import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditService } from "../audit-logs/audit-logs.service";
import { UpdateMembershipStatusDto } from "./dto/update-membership-status.dto";
import { ExtendMembershipDto } from "./dto/extend-membership.dto";
import {
  MembershipDetailRow,
  MembershipListRow,
  MembershipRow,
  MembershipsRepository,
  PaymentRow,
} from "./repository/memberships.repository";
import { MEMBERSHIPS_REPOSITORY } from "./repository/memberships.tokens";

@Injectable()
export class MembershipsService {
  constructor(
    @Inject(MEMBERSHIPS_REPOSITORY)
    private readonly repo: MembershipsRepository,
    private readonly auditService: AuditService,
  ) {}

  // ---------------------------------------------------------------------------
  // Shapers — tái tạo đúng shape JSON mà Prisma include trả về
  // ---------------------------------------------------------------------------

  private baseMembership(
    row: MembershipRow | MembershipListRow | MembershipDetailRow,
  ) {
    return {
      id: row.id,
      memberId: row.memberId,
      packageId: row.packageId,
      startDate: row.startDate,
      endDate: row.endDate,
      price: Number(row.price),
      discountAmount:
        row.discountAmount != null ? Number(row.discountAmount) : null,
      finalAmount: row.finalAmount != null ? Number(row.finalAmount) : null,
      remainingSessions: row.remainingSessions,
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /** findAll: payments chỉ gồm các field rút gọn */
  private shapeListMembership(row: MembershipListRow, payments: PaymentRow[]) {
    return {
      ...this.baseMembership(row),
      member: {
        id: row.member_id,
        code: row.member_code,
        fullName: row.member_fullName,
        phone: row.member_phone,
      },
      package: {
        id: row.package_id,
        name: row.package_name,
        durationDays: row.package_durationDays,
        price: row.package_price != null ? Number(row.package_price) : null,
      },
      payments: payments.map((p) => ({
        id: p.id,
        code: p.code,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }

  private parseJson(value: string | null): unknown {
    if (value == null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  /** findOne: member đầy đủ, package đầy đủ, payments đầy đủ */
  private shapeDetailMembership(
    row: MembershipDetailRow,
    payments: PaymentRow[],
  ) {
    return {
      ...this.baseMembership(row),
      member: {
        id: row.member_id,
        code: row.member_code,
        userId: row.member_userId,
        fullName: row.member_fullName,
        email: row.member_email,
        phone: row.member_phone,
        gender: row.member_gender,
        dateOfBirth: row.member_dateOfBirth,
        address: row.member_address,
        avatarUrl: row.member_avatarUrl,
        status: row.member_status,
        notes: row.member_notes,
        emergencyContact: row.member_emergencyContact,
        joinedAt: row.member_joinedAt,
        branchId: row.member_branchId,
        createdAt: row.member_createdAt,
        updatedAt: row.member_updatedAt,
      },
      package: {
        id: row.package_id,
        code: row.package_code,
        name: row.package_name,
        description: row.package_description,
        features: this.parseJson(row.package_features),
        durationDays: row.package_durationDays,
        price: row.package_price != null ? Number(row.package_price) : null,
        sessions: row.package_sessions,
        type: row.package_type,
        status: row.package_status,
        allowedBranches: this.parseJson(row.package_allowedBranches),
        createdAt: row.package_createdAt,
        updatedAt: row.package_updatedAt,
      },
      payments: payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        discountAmount:
          p.discountAmount != null ? Number(p.discountAmount) : null,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Đọc
  // ---------------------------------------------------------------------------

  async findAll() {
    const rows = await this.repo.list();
    return Promise.all(
      rows.map(async (row) =>
        this.shapeListMembership(
          row,
          await this.repo.paymentsByMembership(row.id),
        ),
      ),
    );
  }

  async findOne(id: string) {
    const row = await this.repo.findOne(id);
    if (!row)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");
    const payments = await this.repo.paymentsByMembership(id);
    return this.shapeDetailMembership(row, payments);
  }

  // ---------------------------------------------------------------------------
  // Cập nhật trạng thái
  // ---------------------------------------------------------------------------

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
    const row = await this.repo.findById(id);
    if (!row)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

    const next = dto.status as string;
    const cur = row.status;
    const packageName = row.package_name ?? "";
    const memberFullName = row.member_fullName ?? "";

    if (next === "SUSPENDED" && cur !== "ACTIVE") {
      throw new ConflictException(
        "Chỉ có thể tạm khóa thẻ đang hoạt động (ACTIVE)",
      );
    }
    if (next === "ACTIVE" && cur === "PENDING") {
      const hasPaid = await this.repo.hasPaidPayment(id);
      if (!hasPaid) {
        throw new ConflictException(
          "Chưa có khoản thanh toán được xác nhận cho gói này",
        );
      }
    }
    if (next === "CANCELLED" && (cur === "CANCELLED" || cur === "EXPIRED")) {
      throw new ConflictException("Hợp đồng đã ở trạng thái này");
    }

    const notificationContentMap: Record<string, string> = {
      SUSPENDED: `Thẻ tập gói ${packageName} của bạn đã bị tạm khóa${dto.reason ? ` (Lý do: ${dto.reason})` : ""}. Liên hệ lễ tân để biết thêm chi tiết.`,
      ACTIVE: `Gói tập ${packageName} của bạn đã được kích hoạt lại.`,
      CANCELLED: `Hợp đồng gói ${packageName} của bạn đã bị hủy${dto.reason ? ` (Lý do: ${dto.reason})` : ""}.`,
      EXPIRED: `Gói tập ${packageName} của bạn đã hết hạn. Gia hạn ngay để tiếp tục tập luyện!`,
      PENDING: "",
    };

    const titleMap: Record<string, string> = {
      SUSPENDED: "Thẻ tập bị tạm khóa ⛔",
      ACTIVE: "Gói tập đã được kích hoạt ✅",
      CANCELLED: "Hợp đồng đã bị hủy 🗑️",
      EXPIRED: "Gói tập đã hết hạn ⚠️",
      PENDING: "",
    };

    const content = notificationContentMap[next];
    const notification = content ? { title: titleMap[next], content } : null;

    const updated = await this.repo.setStatus(id, next, notification);
    if (!updated)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_STATUS_CHANGE",
      entity: "Membership",
      entityId: id,
      metadata: {
        from: cur,
        to: next,
        reason: dto.reason ?? null,
        memberName: memberFullName,
      },
    });

    return {
      message: `Đã cập nhật trạng thái thành ${next}`,
      membership: this.baseMembership(updated),
    };
  }

  // ---------------------------------------------------------------------------
  // Gia hạn
  // ---------------------------------------------------------------------------

  /** Admin gia hạn thêm N ngày + tạo Payment PENDING (chờ thu tiền) */
  async extend(id: string, dto: ExtendMembershipDto, actorId?: string) {
    const row = await this.repo.findById(id);
    if (!row)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

    if (row.status === "EXPIRED" || row.status === "CANCELLED") {
      throw new ConflictException("Không thể gia hạn hợp đồng đã kết thúc");
    }

    const packageName = row.package_name ?? "";
    const newEndDate = new Date(
      new Date(row.endDate).getTime() + dto.days * 24 * 60 * 60 * 1000,
    );
    const code = await this.genPaymentCode();

    const notificationContent =
      `Lễ tân đã gia hạn thêm ${dto.days} ngày cho gói ${packageName}. ` +
      `Hạn sử dụng mới: ${newEndDate.toLocaleDateString("vi-VN")}. Vui lòng đến quầy thu ngân để thanh toán.`;

    const updated = await this.repo.extend({
      id,
      days: dto.days,
      paymentCode: code,
      reason: dto.reason ?? null,
      notificationContent,
    });
    if (!updated)
      throw new NotFoundException("Không tìm thấy hợp đồng/thẻ hội viên");

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

    return {
      message: `Đã gia hạn thêm ${dto.days} ngày (hạn mới: ${newEndDate.toLocaleDateString("vi-VN")})`,
      membership: this.baseMembership(updated),
    };
  }

  private async genPaymentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.repo.paymentCount();
    return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
  }
}
