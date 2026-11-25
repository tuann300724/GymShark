import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PartnerStatus } from "../../common/constants/db-enums";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { PartnerBranchDto } from "./dto/update-partner-branch.dto";
import { UpdatePartnerProfileDto } from "./dto/update-partner-profile.dto";
import { QueryPartnersDto } from "./dto/query-partners.dto";

export type PartnerDecision = "APPROVE" | "REJECT" | "SUSPEND";

const PARTNER_SELECT = {
  id: true,
  businessName: true,
  taxCode: true,
  phone: true,
  email: true,
  address: true,
  status: true,
  commissionRate: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.PartnerSelect;

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Lấy hồ sơ đối tác theo userId từ JWT — KHÔNG cho phép truyền id của đối tác khác. */
  private async getPartnerOfUser(userId: string) {
    if (!userId) throw new ForbiddenException("Phiên đăng nhập không hợp lệ");
    const partner = await this.prisma.partner.findUnique({
      where: { userId },
      select: PARTNER_SELECT,
    });
    if (!partner)
      throw new NotFoundException(
        "Không tìm thấy hồ sơ đối tác của tài khoản này",
      );
    return partner;
  }

  private assertCanManage(partner: { status: string }) {
    if (partner.status === PartnerStatus.SUSPENDED) {
      throw new ForbiddenException("Hồ sơ đối tác đang bị tạm khóa");
    }
    if (partner.status === PartnerStatus.REJECTED) {
      throw new ForbiddenException(
        "Hồ sơ đối tác đã bị từ chối, vui lòng liên hệ quản trị viên",
      );
    }
  }

  async getMyProfile(userId: string) {
    const partner = await this.getPartnerOfUser(userId);
    const [branches, paid] = await this.prisma.$transaction([
      this.prisma.partnerBranch.count({ where: { partnerId: partner.id } }),
      this.prisma.payment.aggregate({
        where: { partnerId: partner.id, status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    return {
      ...partner,
      stats: {
        branches: branches,
        paidPayments: paid._count._all,
        paidAmount: paid._sum.amount?.toString() ?? "0",
      },
    };
  }

  async updateMyProfile(userId: string, dto: UpdatePartnerProfileDto) {
    const partner = await this.getPartnerOfUser(userId);
    this.assertCanManage(partner);
    const updated = await this.prisma.partner.update({
      where: { id: partner.id },
      data: {
        businessName: dto.businessName.trim(),
        taxCode: dto.taxCode?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        address: dto.address?.trim() || null,
      },
      select: PARTNER_SELECT,
    });
    await this.audit.log({
      userId,
      action: "PARTNER_PROFILE_UPDATE",
      entity: "Partner",
      entityId: partner.id,
      metadata: { businessName: updated.businessName },
    });
    return updated;
  }

  async listMyBranches(userId: string) {
    const partner = await this.getPartnerOfUser(userId);
    return this.prisma.partnerBranch.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "asc" },
    });
  }

  async createBranch(userId: string, dto: PartnerBranchDto) {
    const partner = await this.getPartnerOfUser(userId);
    this.assertCanManage(partner);
    const branch = await this.prisma.partnerBranch.create({
      data: {
        partnerId: partner.id,
        name: dto.name.trim(),
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
    });
    await this.audit.log({
      userId,
      action: "PARTNER_BRANCH_CREATE",
      entity: "PartnerBranch",
      entityId: branch.id,
      metadata: { partnerId: partner.id, name: branch.name },
    });
    return branch;
  }

  /** Chỉ cho phép sửa chi nhánh thuộc đối tác của chính người dùng này. */
  private async getOwnBranch(userId: string, branchId: string) {
    const partner = await this.getPartnerOfUser(userId);
    const branch = await this.prisma.partnerBranch.findUnique({
      where: { id: branchId },
    });
    if (!branch || branch.partnerId !== partner.id) {
      throw new NotFoundException(
        "Không tìm thấy chi nhánh thuộc quyền quản lý của bạn",
      );
    }
    return { partner, branch };
  }

  async updateBranch(userId: string, branchId: string, dto: PartnerBranchDto) {
    const { partner, branch } = await this.getOwnBranch(userId, branchId);
    this.assertCanManage(partner);
    const updated = await this.prisma.partnerBranch.update({
      where: { id: branch.id },
      data: {
        name: dto.name.trim(),
        address: dto.address?.trim() || null,
        phone: dto.phone?.trim() || null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      },
    });
    await this.audit.log({
      userId,
      action: "PARTNER_BRANCH_UPDATE",
      entity: "PartnerBranch",
      entityId: branch.id,
      metadata: { partnerId: partner.id, name: updated.name },
    });
    return updated;
  }

  async deleteBranch(userId: string, branchId: string) {
    const { partner, branch } = await this.getOwnBranch(userId, branchId);
    this.assertCanManage(partner);
    await this.prisma.partnerBranch.delete({ where: { id: branch.id } });
    await this.audit.log({
      userId,
      action: "PARTNER_BRANCH_DELETE",
      entity: "PartnerBranch",
      entityId: branch.id,
      metadata: { partnerId: partner.id, name: branch.name },
    });
    return { message: "Đã xóa chi nhánh" };
  }

  /** Doanh thu riêng của đối tác — KHÔNG trả về thông tin hội viên. */
  async getMyRevenue(userId: string, months = 12) {
    const partner = await this.getPartnerOfUser(userId);
    const range = Math.min(24, Math.max(1, Number(months) || 12));
    const since = new Date();
    since.setMonth(since.getMonth() - (range - 1), 1);
    since.setHours(0, 0, 0, 0);

    const payments = await this.prisma.payment.findMany({
      where: {
        partnerId: partner.id,
        status: "PAID",
        OR: [
          { paidAt: { gte: since } },
          { paidAt: null, createdAt: { gte: since } },
        ],
      },
      select: {
        id: true,
        code: true,
        amount: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0),
    );
    const byMonth = new Map<string, Prisma.Decimal>();
    for (const p of payments) {
      const d = p.paidAt ?? p.createdAt;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(
        key,
        (byMonth.get(key) ?? new Prisma.Decimal(0)).add(p.amount),
      );
    }

    const pending = await this.prisma.payment.aggregate({
      where: { partnerId: partner.id, status: "PENDING" },
      _sum: { amount: true },
      _count: { _all: true },
    });

    return {
      totalPaid: totalPaid.toString(),
      paidCount: payments.length,
      pendingAmount: pending._sum.amount?.toString() ?? "0",
      pendingCount: pending._count._all,
      monthly: Array.from(byMonth.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount: amount.toString() })),
      recentPayments: payments.slice(0, 20),
    };
  }

  /** Tổng hợp hoa hồng theo từng lượt tập — KHÔNG chứa dữ liệu hội viên. */
  async getMyCommission(userId: string) {
    const partner = await this.getPartnerOfUser(userId);
    const since = new Date();
    since.setMonth(since.getMonth() - 11, 1);
    since.setHours(0, 0, 0, 0);

    const visits = await this.prisma.checkIn.findMany({
      where: { partnerId: partner.id, checkInTime: { gte: since } },
      select: { checkInTime: true, unitPrice: true, commissionAmount: true },
      orderBy: { checkInTime: "asc" },
    });

    const totalCommission = visits.reduce(
      (sum, v) => sum.add(v.commissionAmount ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );
    const totalRevenue = visits.reduce(
      (sum, v) => sum.add(v.unitPrice ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );
    const monthly = new Map<string, Prisma.Decimal>();
    for (const v of visits) {
      const key = `${v.checkInTime.getFullYear()}-${String(v.checkInTime.getMonth() + 1).padStart(2, "0")}`;
      monthly.set(
        key,
        (monthly.get(key) ?? new Prisma.Decimal(0)).add(
          v.commissionAmount ?? new Prisma.Decimal(0),
        ),
      );
    }

    return {
      commissionRate: Number(partner.commissionRate),
      visitCount: visits.length,
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      monthly: Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount: amount.toString() })),
    };
  }

  // ---------------------------------------------------------------------------
  // ADMIN — toàn quyền xem/sửa mọi hồ sơ đối tác
  // ---------------------------------------------------------------------------

  async adminList(query: QueryPartnersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const where: Prisma.PartnerWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
        { taxCode: { contains: query.search } },
        { user: { fullName: { contains: query.search } } },
        { user: { email: { contains: query.search } } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.partner.findMany({
        where,
        select: {
          ...PARTNER_SELECT,
          _count: { select: { branches: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.partner.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async adminDetail(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      select: {
        ...PARTNER_SELECT,
        branches: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");

    const [paid, pending, payments] = await this.prisma.$transaction([
      this.prisma.payment.aggregate({
        where: { partnerId: id, status: "PAID" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { partnerId: id, status: "PENDING" },
        _sum: { amount: true },
      }),
      this.prisma.payment.findMany({
        where: { partnerId: id },
        select: {
          id: true,
          code: true,
          amount: true,
          status: true,
          method: true,
          paidAt: true,
          createdAt: true,
          member: { select: { id: true, code: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      ...partner,
      stats: {
        paidAmount: paid._sum.amount?.toString() ?? "0",
        paidCount: paid._count._all,
        pendingAmount: pending._sum.amount?.toString() ?? "0",
      },
      payments,
    };
  }

  /** Tổng hợp hoa hồng & lịch sử lượt tập tại một phòng gym (admin/manager). */
  async adminCommission(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");

    const visits = await this.prisma.checkIn.findMany({
      where: { partnerId: id },
      select: {
        id: true,
        checkInTime: true,
        checkOutTime: true,
        method: true,
        unitPrice: true,
        commissionRate: true,
        commissionAmount: true,
        member: { select: { id: true, code: true, fullName: true } },
      },
      orderBy: { checkInTime: "desc" },
      take: 200,
    });

    const totalCommission = visits.reduce(
      (sum, v) => sum.add(v.commissionAmount ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );
    const totalRevenue = visits.reduce(
      (sum, v) => sum.add(v.unitPrice ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0),
    );

    return {
      partnerId: id,
      commissionRate: Number(partner.commissionRate),
      visitCount: visits.length,
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      visits,
    };
  }

  /** Admin chỉnh tỷ lệ hoa hồng: DTO nhận phần trăm 0..100, lưu 0..1. */
  async adminUpdateCommission(id: string, percent: number, actorId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");

    const rate = Math.round((Number(percent) / 100) * 10000) / 10000;
    const updated = await this.prisma.partner.update({
      where: { id },
      data: { commissionRate: new Prisma.Decimal(rate) },
      select: PARTNER_SELECT,
    });

    await this.audit.log({
      userId: actorId,
      action: "PARTNER_COMMISSION_UPDATE",
      entity: "Partner",
      entityId: id,
      metadata: {
        businessName: partner.businessName,
        previousRate: Number(partner.commissionRate),
        commissionRate: rate,
      },
    });
    return updated;
  }

  async adminDecision(
    id: string,
    decision: PartnerDecision,
    note: string | undefined,
    actorId: string,
  ) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");

    let status: PartnerStatus;
    let action: string;
    if (decision === "APPROVE") {
      status = PartnerStatus.APPROVED;
      action = "PARTNER_APPROVE";
    } else if (decision === "REJECT") {
      status = PartnerStatus.REJECTED;
      action = "PARTNER_REJECT";
    } else {
      status = PartnerStatus.SUSPENDED;
      action = "PARTNER_SUSPEND";
    }

    const updated = await this.prisma.partner.update({
      where: { id },
      data: { status, notes: note?.trim() || partner.notes },
      select: PARTNER_SELECT,
    });

    await this.audit.log({
      userId: actorId,
      action,
      entity: "Partner",
      entityId: id,
      metadata: {
        businessName: partner.businessName,
        previousStatus: partner.status,
        status,
        note: note ?? null,
      },
    });
    return updated;
  }

  /** Admin gán một giao dịch đã tồn tại cho đối tác để tính doanh thu riêng. */
  async adminAssignPayment(id: string, paymentCode: string, actorId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");
    const payment = await this.prisma.payment.findUnique({
      where: { code: paymentCode.trim() },
    });
    if (!payment)
      throw new NotFoundException("Không tìm thấy giao dịch với mã này");
    if (payment.partnerId && payment.partnerId !== id) {
      throw new BadRequestException(
        "Giao dịch này đã được gán cho đối tác khác",
      );
    }
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { partnerId: id },
      select: {
        id: true,
        code: true,
        amount: true,
        status: true,
        partnerId: true,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: "PARTNER_PAYMENT_ASSIGN",
      entity: "Payment",
      entityId: payment.id,
      metadata: { partnerId: id, code: payment.code },
    });
    return updated;
  }

  async adminUnassignPayment(id: string, paymentId: string, actorId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.partnerId !== id) {
      throw new NotFoundException(
        "Không tìm thấy giao dịch được gán cho đối tác này",
      );
    }
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { partnerId: null },
    });
    await this.audit.log({
      userId: actorId,
      action: "PARTNER_PAYMENT_UNASSIGN",
      entity: "Payment",
      entityId: paymentId,
      metadata: { partnerId: id, code: payment.code },
    });
    return { message: "Đã bỏ gán giao dịch khỏi đối tác" };
  }
}
