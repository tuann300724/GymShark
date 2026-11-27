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
import { NotificationsService } from "../notifications/notifications.service";
import { PartnerBranchDto } from "./dto/update-partner-branch.dto";
import { UpdatePartnerProfileDto } from "./dto/update-partner-profile.dto";
import { QueryPartnersDto } from "./dto/query-partners.dto";
import {
  UpdatePartnerContractDto,
  UpdatePartnershipPlanDto,
  RenewalRequestDto,
} from "./dto/partnership.dto";
import { parseJsonText } from "../../common/utils/json-text";
import { assertPartnerOwner, resolvePartnerIdForUser } from "../../common/utils/partner-scope";

const RENEWAL_ACTION = "PARTNER_RENEWAL_REQUEST";
const RENEWAL_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
  gymTier: true,
  tierNote: true,
  tierAssessedAt: true,
  partnershipType: true,
  monthlyFee: true,
  contractStartAt: true,
  contractEndAt: true,
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
    private readonly notifications: NotificationsService,
  ) {}

  /** Báo quản trị mọi thay đổi cơ sở do đối tác tự thực hiện. */
  private notifyBranchChange(
    partner: { id: string; businessName: string },
    action: "CREATED" | "UPDATED" | "DELETED",
    branch: { id: string; name: string },
  ) {
    const verb = {
      CREATED: "thêm cơ sở mới",
      UPDATED: "cập nhật cơ sở",
      DELETED: "xóa cơ sở",
    }[action];
    return this.notifications.notifyAdmins({
      type: "SYSTEM",
      title: `Đối tác ${verb}`,
      content: `${partner.businessName} vừa ${verb} "${branch.name}".`,
      link: `/admin/partners/${partner.id}`,
      referenceType: `PARTNER_BRANCH_${action}`,
      // Sửa cơ sở có thể lặp lại nhiều lần — không gắn referenceId để không bị gộp trùng.
      referenceId: action === "UPDATED" ? undefined : branch.id,
      data: { partnerId: partner.id, branchId: branch.id },
    });
  }

  /** Lấy hồ sơ đối tác theo userId từ JWT — KHÔNG cho phép truyền id của đối tác khác. */
  private async getPartnerOfUser(userId: string) {
    if (!userId) throw new ForbiddenException("Phiên đăng nhập không hợp lệ");
    // Chủ đối tác hoặc nhân viên của đối tác (User.ownerPartnerId)
    const partnerId = await resolvePartnerIdForUser(this.prisma, userId);
    const partner = partnerId
      ? await this.prisma.partner.findUnique({
          where: { id: partnerId },
          select: PARTNER_SELECT,
        })
      : null;
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
    await assertPartnerOwner(this.prisma, userId);
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
    await this.notifyBranchChange(partner, "CREATED", branch);
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
    await assertPartnerOwner(this.prisma, userId);
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
    await this.notifyBranchChange(partner, "UPDATED", updated);
    return updated;
  }

  async deleteBranch(userId: string, branchId: string) {
    await assertPartnerOwner(this.prisma, userId);
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
    await this.notifyBranchChange(partner, "DELETED", branch);
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
      select: {
        id: true,
        memberId: true,
        checkInTime: true,
        unitPrice: true,
        commissionRate: true,
        commissionAmount: true,
        // Chỉ mã + tên hội viên (không SĐT/email — NĐ13/2023)
        member: { select: { code: true, fullName: true, ownerPartnerId: true } },
      },
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

    // Hoa hồng theo từng hội viên (nhiều hoa hồng nhất trước)
    const zero = () => new Prisma.Decimal(0);
    const byMember = new Map<
      string,
      {
        memberId: string;
        code: string;
        fullName: string;
        /** Hội viên hệ thống Gym Master (cộng đồng) hay hội viên riêng của phòng */
        community: boolean;
        visitCount: number;
        revenue: Prisma.Decimal;
        commission: Prisma.Decimal;
        lastVisitAt: Date;
      }
    >();
    for (const v of visits) {
      const row = byMember.get(v.memberId) ?? {
        memberId: v.memberId,
        code: v.member.code,
        fullName: v.member.fullName,
        community: v.member.ownerPartnerId == null,
        visitCount: 0,
        revenue: zero(),
        commission: zero(),
        lastVisitAt: v.checkInTime,
      };
      row.visitCount += 1;
      row.revenue = row.revenue.add(v.unitPrice ?? 0);
      row.commission = row.commission.add(v.commissionAmount ?? 0);
      row.lastVisitAt = v.checkInTime;
      byMember.set(v.memberId, row);
    }

    return {
      commissionRate: Number(partner.commissionRate),
      visitCount: visits.length,
      totalRevenue: totalRevenue.toString(),
      totalCommission: totalCommission.toString(),
      byMember: Array.from(byMember.values())
        .sort((a, b) => b.commission.comparedTo(a.commission) || b.visitCount - a.visitCount)
        .map((r) => ({
          ...r,
          revenue: r.revenue.toString(),
          commission: r.commission.toString(),
        })),
      // 100 lượt gần nhất: giá 1 lượt × tỷ lệ (chốt lúc check-in) = hoa hồng
      recentVisits: visits
        .slice(-100)
        .reverse()
        .map((v) => ({
          id: v.id,
          checkInTime: v.checkInTime,
          memberCode: v.member.code,
          memberName: v.member.fullName,
          unitPrice: (v.unitPrice ?? 0).toString(),
          commissionRate: v.commissionRate != null ? Number(v.commissionRate) : null,
          commissionAmount: (v.commissionAmount ?? 0).toString(),
        })),
      monthly: Array.from(monthly.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount: amount.toString() })),
    };
  }

  /**
   * Hội viên Gym Master (gói nền tảng) đã tập tại phòng của đối tác, 12 tháng gần nhất.
   * Chỉ trả thông tin tối thiểu (mã, tên, ảnh, gói, số lượt, hoa hồng) — KHÔNG có SĐT/email:
   * hồ sơ đầy đủ thuộc nền tảng, đối tác chỉ phục vụ lượt tập (NĐ13/2023).
   */
  async getMyNetworkMembers(userId: string) {
    const partner = await this.getPartnerOfUser(userId);
    const since = new Date();
    since.setMonth(since.getMonth() - 11, 1);
    since.setHours(0, 0, 0, 0);

    const visits = await this.prisma.checkIn.findMany({
      where: {
        partnerId: partner.id,
        checkInTime: { gte: since },
        member: { is: { ownerPartnerId: null } },
      },
      select: {
        memberId: true,
        checkInTime: true,
        commissionAmount: true,
        member: { select: { code: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { checkInTime: "desc" },
    });

    const byMember = new Map<
      string,
      {
        memberId: string;
        code: string;
        fullName: string;
        avatarUrl: string | null;
        visitCount: number;
        lastVisitAt: Date;
        commission: Prisma.Decimal;
      }
    >();
    for (const v of visits) {
      const row = byMember.get(v.memberId);
      if (row) {
        row.visitCount += 1;
        row.commission = row.commission.add(v.commissionAmount ?? 0);
      } else {
        byMember.set(v.memberId, {
          memberId: v.memberId,
          code: v.member.code,
          fullName: v.member.fullName,
          avatarUrl: v.member.avatarUrl,
          visitCount: 1,
          lastVisitAt: v.checkInTime,
          commission: new Prisma.Decimal(v.commissionAmount ?? 0),
        });
      }
    }

    // Tên gói đang hiệu lực (chỉ tên, không lộ giá/hợp đồng)
    const ids = Array.from(byMember.keys());
    const now = new Date();
    const active = ids.length
      ? await this.prisma.membership.findMany({
          where: {
            memberId: { in: ids },
            status: "ACTIVE",
            startDate: { lte: now },
            endDate: { gte: now },
          },
          select: { memberId: true, endDate: true, package: { select: { name: true } } },
          orderBy: { endDate: "desc" },
        })
      : [];
    const packageOf = new Map<string, string>();
    for (const m of active) {
      if (!packageOf.has(m.memberId)) packageOf.set(m.memberId, m.package.name);
    }

    const rows = Array.from(byMember.values()).map((row) => ({
      ...row,
      commission: row.commission.toString(),
      packageName: packageOf.get(row.memberId) ?? null,
    }));
    return {
      partnershipType: partner.partnershipType,
      memberCount: rows.length,
      visitCount: visits.length,
      items: rows,
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
    if (query.partnershipType) where.partnershipType = query.partnershipType;
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

    // Yêu cầu gia hạn gần nhất chưa được xử lý (gửi sau lần cập nhật hợp đồng cuối)
    const [renewal, lastContractUpdate] = await Promise.all([
      this.prisma.auditLog.findFirst({
        where: { action: RENEWAL_ACTION, entity: "Partner", entityId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, metadata: true },
      }),
      this.prisma.auditLog.findFirst({
        where: { action: "PARTNER_CONTRACT_UPDATE", entity: "Partner", entityId: id },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);
    const renewalMeta = renewal
      ? (parseJsonText<{ months?: number; note?: string | null }>(renewal.metadata) ?? {})
      : {};
    const pendingRenewal =
      renewal && (!lastContractUpdate || lastContractUpdate.createdAt < renewal.createdAt)
        ? { at: renewal.createdAt, months: renewalMeta.months ?? null, note: renewalMeta.note ?? null }
        : null;

    return {
      ...partner,
      stats: {
        paidAmount: paid._sum.amount?.toString() ?? "0",
        paidCount: paid._count._all,
        pendingAmount: pending._sum.amount?.toString() ?? "0",
      },
      payments,
      pendingRenewal,
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

  // ---------------------------------------------------------------------------
  // Đối tác tự xem hợp đồng & xin gia hạn
  // ---------------------------------------------------------------------------

  /** Hợp đồng của đối tác đang đăng nhập + gói tập hệ thống được vào phòng của họ. */
  async getMyPartnership(userId: string) {
    const partner = await this.getPartnerOfUser(userId);
    const plan = partner.partnershipType
      ? await this.prisma.partnershipPlan.findUnique({
          where: { code: partner.partnershipType },
          select: { name: true, monthlyPrice: true },
        })
      : null;

    // Gym Cộng đồng đã xếp hạng → liệt kê gói tập đang bán có quyền vào hạng phòng này
    let eligiblePackages: Array<{
      id: string;
      name: string;
      type: string;
      price: Prisma.Decimal;
      durationDays: number;
      visitLimit: number | null;
    }> = [];
    let totalActivePackages = 0;
    if (partner.partnershipType === "COMMUNITY") {
      const packages = await this.prisma.membershipPackage.findMany({
        where: { status: "ACTIVE", type: { not: "SESSION_BASED" }, ownerPartnerId: null },
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          durationDays: true,
          visitLimit: true,
          gymTierAccess: true,
        },
        orderBy: { price: "asc" },
      });
      totalActivePackages = packages.length;
      eligiblePackages = partner.gymTier
        ? packages
            .filter((pkg) => {
              try {
                return (parseJsonText<string[]>(pkg.gymTierAccess) ?? []).includes(
                  partner.gymTier!,
                );
              } catch {
                return false;
              }
            })
            .map(({ gymTierAccess: _ignored, ...rest }) => rest)
        : [];
    }

    const lastRequest = await this.prisma.auditLog.findFirst({
      where: { action: RENEWAL_ACTION, entity: "Partner", entityId: partner.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, metadata: true },
    });
    const lastMeta = lastRequest ? (parseJsonText<{ months?: number }>(lastRequest.metadata) ?? {}) : {};

    return {
      businessName: partner.businessName,
      status: partner.status,
      partnershipType: partner.partnershipType,
      planName: plan?.name ?? null,
      currentPlanPrice: plan?.monthlyPrice ?? null,
      monthlyFee: partner.monthlyFee,
      contractStartAt: partner.contractStartAt,
      contractEndAt: partner.contractEndAt,
      commissionRate: Number(partner.commissionRate),
      gymTier: partner.gymTier,
      tierNote: partner.tierNote,
      tierAssessedAt: partner.tierAssessedAt,
      eligiblePackages,
      totalActivePackages,
      lastRenewalRequest: lastRequest
        ? { at: lastRequest.createdAt, months: lastMeta.months ?? null }
        : null,
    };
  }

  /** Đối tác xin gia hạn: báo admin qua chuông, ghi nhật ký; tối đa 1 yêu cầu/24h. */
  async requestRenewal(userId: string, dto: RenewalRequestDto) {
    await assertPartnerOwner(this.prisma, userId);
    const partner = await this.getPartnerOfUser(userId);
    if (partner.status !== PartnerStatus.APPROVED) {
      throw new ForbiddenException("Tài khoản đối tác chưa được duyệt hoặc đang bị khóa.");
    }
    const recent = await this.prisma.auditLog.findFirst({
      where: {
        action: RENEWAL_ACTION,
        entity: "Partner",
        entityId: partner.id,
        createdAt: { gte: new Date(Date.now() - RENEWAL_COOLDOWN_MS) },
      },
      select: { id: true },
    });
    if (recent) {
      throw new BadRequestException(
        "Bạn đã gửi yêu cầu gia hạn trong 24 giờ qua. Vui lòng chờ quản trị viên liên hệ.",
      );
    }

    const note = dto.note?.trim() || null;
    const fee = Number(partner.monthlyFee ?? 0);
    await this.audit.log({
      userId,
      action: RENEWAL_ACTION,
      entity: "Partner",
      entityId: partner.id,
      metadata: {
        businessName: partner.businessName,
        months: dto.months,
        note,
        contractEndAt: partner.contractEndAt,
      },
    });
    await this.notifications.notifyAdmins({
      type: "SYSTEM",
      title: "Đối tác xin gia hạn hợp đồng 📅",
      content: `${partner.businessName} xin gia hạn ${dto.months} tháng${
        fee ? ` (≈ ${(fee * dto.months).toLocaleString("vi-VN")}đ)` : ""
      }${
        partner.contractEndAt
          ? `, hợp đồng hết hạn ${partner.contractEndAt.toLocaleDateString("vi-VN")}`
          : ""
      }.${note ? ` Ghi chú: ${note}` : ""}`,
      link: `/admin/partners/${partner.id}`,
      referenceType: "PARTNER_RENEWAL_REQUEST",
    });
    return {
      message: "Đã gửi yêu cầu gia hạn. Quản trị viên sẽ liên hệ để xác nhận thanh toán.",
    };
  }

  // ---------------------------------------------------------------------------
  // Bảng giá gói hợp tác & hợp đồng đối tác
  // ---------------------------------------------------------------------------

  async listPlans() {
    return this.prisma.partnershipPlan.findMany({ orderBy: { monthlyPrice: "asc" } });
  }

  async updatePlan(code: string, dto: UpdatePartnershipPlanDto, actorId: string) {
    const plan = await this.prisma.partnershipPlan.findUnique({ where: { code } });
    if (!plan) throw new NotFoundException("Không tìm thấy gói hợp tác");
    const updated = await this.prisma.partnershipPlan.update({
      where: { code },
      data: {
        monthlyPrice: new Prisma.Decimal(dto.monthlyPrice),
        ...(dto.name?.trim() ? { name: dto.name.trim() } : {}),
        updatedBy: actorId,
      },
    });
    await this.audit.log({
      userId: actorId,
      action: "PARTNERSHIP_PLAN_UPDATE",
      entity: "PartnershipPlan",
      entityId: code,
      metadata: {
        name: updated.name,
        previousPrice: Number(plan.monthlyPrice),
        monthlyPrice: dto.monthlyPrice,
      },
    });
    return updated;
  }

  /** Đổi loại hợp tác và/hoặc gia hạn hợp đồng thêm N tháng. */
  async adminUpdateContract(id: string, dto: UpdatePartnerContractDto, actorId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");
    if (!dto.partnershipType && !dto.extendMonths) {
      throw new BadRequestException("Chọn loại hợp tác hoặc số tháng gia hạn.");
    }

    const data: Prisma.PartnerUpdateInput = {};
    if (dto.partnershipType && dto.partnershipType !== partner.partnershipType) {
      const plan = await this.prisma.partnershipPlan.findUnique({
        where: { code: dto.partnershipType },
      });
      data.partnershipType = dto.partnershipType;
      if (plan) data.monthlyFee = plan.monthlyPrice;
    }
    if (dto.extendMonths) {
      const now = new Date();
      // Còn hạn → cộng tiếp từ ngày hết hạn; đã hết hạn/chưa có → tính lại từ hôm nay.
      const base =
        partner.contractEndAt && partner.contractEndAt > now ? partner.contractEndAt : now;
      const end = new Date(base);
      end.setMonth(end.getMonth() + dto.extendMonths);
      data.contractEndAt = end;
      if (!partner.contractStartAt || base === now) data.contractStartAt = now;
    }

    const updated = await this.prisma.partner.update({
      where: { id },
      data,
      select: PARTNER_SELECT,
    });
    await this.audit.log({
      userId: actorId,
      action: "PARTNER_CONTRACT_UPDATE",
      entity: "Partner",
      entityId: id,
      metadata: {
        businessName: partner.businessName,
        previousType: partner.partnershipType,
        partnershipType: updated.partnershipType,
        extendMonths: dto.extendMonths ?? null,
        previousEnd: partner.contractEndAt,
        contractEndAt: updated.contractEndAt,
      },
    });
    // Báo chủ đối tác qua chuông thông báo
    await this.notifications.create({
      userId: partner.userId,
      type: "SYSTEM",
      title: dto.extendMonths ? "Hợp đồng đã được gia hạn 📅" : "Gói hợp tác đã thay đổi",
      content: dto.extendMonths
        ? `Gym Master đã gia hạn hợp đồng thêm ${dto.extendMonths} tháng, hết hạn ngày ${updated.contractEndAt?.toLocaleDateString("vi-VN") ?? "—"}.`
        : `Gói hợp tác của bạn đã chuyển sang ${updated.partnershipType === "COMMUNITY" ? "Gym Cộng đồng" : "Tự quản lý"}.`,
      link: "/admin/partnership",
    });
    return updated;
  }

  async adminUpdateTier(
    id: string,
    gymTier: string | null,
    note: string | undefined,
    actorId: string,
  ) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException("Không tìm thấy đối tác");
    const tierNote = note?.trim() || null;
    if (gymTier && !tierNote) {
      throw new BadRequestException("Vui lòng ghi căn cứ xếp hạng phòng gym.");
    }

    const updated = await this.prisma.partner.update({
      where: { id },
      data: {
        gymTier,
        tierNote,
        tierAssessedAt: gymTier ? new Date() : null,
      },
      select: PARTNER_SELECT,
    });

    await this.audit.log({
      userId: actorId,
      action: "PARTNER_TIER_UPDATE",
      entity: "Partner",
      entityId: id,
      metadata: {
        businessName: partner.businessName,
        previousTier: partner.gymTier,
        gymTier,
        note: tierNote,
      },
    });
    await this.notifications.create({
      userId: partner.userId,
      type: "SYSTEM",
      title: "Hạng phòng gym đã được cập nhật 🏅",
      content: gymTier
        ? `Gym Master xếp phòng của bạn hạng ${{ TIER_1: "Standard", TIER_2: "Plus", TIER_3: "Premium" }[gymTier] ?? gymTier}.${tierNote ? ` Nhận xét: ${tierNote}` : ""}`
        : "Phòng của bạn tạm chưa được xếp hạng.",
      link: "/admin/partnership",
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
