import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePartnerLeadDto } from "./dto/create-partner-lead.dto";
import { QueryPartnerLeadsDto } from "./dto/query-partner-leads.dto";
import {
  AssessPartnerLeadDto,
  TransitionPartnerLeadDto,
  UpdatePartnerLeadDto,
} from "./dto/update-partner-lead.dto";
import {
  COMMUNITY_MIN_PHOTOS,
  NOTE_REQUIRED_STATUSES,
  PARTNER_LEAD_AUDIT,
  PARTNER_LEAD_STATUSES,
  PARTNER_LEAD_STATUS_LABELS,
  canTransition,
  type PartnerLeadStatus,
} from "./partner-lead-workflow";
import { MailService } from "../mail/mail.service";
import { UserRole, UserStatus } from "../../common/constants/db-enums";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class PartnerLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreatePartnerLeadDto, ip?: string) {
    const photos = dto.direction === "COMMUNITY" ? (dto.photos ?? []) : [];
    // Gym Cộng đồng: hội viên toàn hệ thống sẽ đến tập → bắt buộc có ảnh để admin xếp hạng.
    if (dto.direction === "COMMUNITY" && photos.length < COMMUNITY_MIN_PHOTOS) {
      throw new BadRequestException(
        `Hướng Gym Cộng đồng cần tối thiểu ${COMMUNITY_MIN_PHOTOS} ảnh phòng tập và cơ sở vật chất.`,
      );
    }

    const lead = await this.prisma.partnerLead.create({
      data: {
        direction: dto.direction,
        contactName: dto.contactName.trim(),
        address: dto.address?.trim() || null,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        message: dto.message?.trim() || null,
        ip: ip || null,
        photos: photos.length
          ? {
              create: photos.map((photo, index) => ({
                area: photo.area,
                caption: photo.caption?.trim() || null,
                dataUrl: photo.dataUrl,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      select: { id: true, contactName: true, createdAt: true },
    });

    // Báo quản trị qua chuông để không bỏ sót yêu cầu hợp tác mới.
    await this.notificationsService.notifyAdmins({
      type: "SYSTEM",
      title: "Yêu cầu hợp tác mới 🤝",
      content: `${lead.contactName} (${dto.phone.trim()}) muốn trao đổi về ${
        dto.direction === "COMMUNITY"
          ? `Gym Cộng đồng — kèm ${photos.length} ảnh cơ sở vật chất chờ đánh giá hạng`
          : "quản lý phòng gym riêng"
      }.`,
      link: "/admin/partner-leads",
      referenceType: "PARTNER_LEAD_CREATED",
      referenceId: lead.id,
    });

    const emailSent = await this.mailService.sendPartnerLeadReceivedEmail({
      email: dto.email.trim().toLowerCase(),
      contactName: dto.contactName.trim(),
      direction: dto.direction,
    });

    return {
      message: emailSent
        ? "Đã nhận yêu cầu tư vấn và gửi email xác nhận."
        : "Đã nhận yêu cầu tư vấn nhưng chưa gửi được email xác nhận.",
      emailSent,
      lead,
    };
  }

  async adminList(query: QueryPartnerLeadsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const baseWhere = {
      ...(query.direction ? { direction: query.direction } : {}),
      ...(query.search
        ? {
            OR: [
              { contactName: { contains: query.search } },
              { email: { contains: query.search } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };
    const where = {
      ...baseWhere,
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total, ...statusCounts] = await this.prisma.$transaction([
      this.prisma.partnerLead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          direction: true,
          contactName: true,
          address: true,
          email: true,
          phone: true,
          message: true,
          status: true,
          notes: true,
          handledAt: true,
          assessedTier: true,
          assessmentNote: true,
          assessedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { photos: true } },
        },
      }),
      this.prisma.partnerLead.count({ where }),
      // Đếm theo từng bước của quy trình (bỏ qua lọc trạng thái) cho thanh pipeline
      ...PARTNER_LEAD_STATUSES.map((status) =>
        this.prisma.partnerLead.count({ where: { ...baseWhere, status } }),
      ),
    ]);
    const counts = Object.fromEntries(
      PARTNER_LEAD_STATUSES.map((status, index) => [status, statusCounts[index] ?? 0]),
    ) as Record<PartnerLeadStatus, number>;

    const emails = data.map((lead) => lead.email);
    const accounts = emails.length
      ? await this.prisma.user.findMany({
          where: { email: { in: emails }, role: UserRole.PARTNER },
          select: { email: true, partner: { select: { id: true } } },
        })
      : [];
    const partnerEmails = new Set(
      accounts
        .filter((account) => account.partner)
        .map((account) => account.email),
    );

    return {
      data: data.map((lead) => ({
        ...lead,
        accountCreated: partnerEmails.has(lead.email),
      })),
      total,
      page,
      limit,
      counts,
    };
  }

  private async findLeadOrThrow(id: string) {
    const lead = await this.prisma.partnerLead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException("Không tìm thấy yêu cầu hợp tác.");
    return lead;
  }

  /** Ảnh cơ sở vật chất đối tác gửi kèm (chỉ admin/manager xem). */
  async photos(id: string) {
    await this.findLeadOrThrow(id);
    return this.prisma.partnerLeadPhoto.findMany({
      where: { leadId: id },
      orderBy: { sortOrder: "asc" },
      select: { id: true, area: true, caption: true, dataUrl: true, createdAt: true },
    });
  }

  /**
   * Admin xếp hạng phòng gym sau khi xem ảnh / khảo sát. Có thể đánh giá lại
   * cho tới khi tạo tài khoản; sau đó chỉnh hạng ở trang chi tiết đối tác.
   */
  async assess(id: string, dto: AssessPartnerLeadDto, actorId: string) {
    const lead = await this.findLeadOrThrow(id);
    if (lead.direction !== "COMMUNITY") {
      throw new BadRequestException("Chỉ yêu cầu Gym Cộng đồng mới cần đánh giá hạng phòng.");
    }
    if (lead.status === "CLOSED") {
      throw new BadRequestException("Yêu cầu đã đóng — hãy mở lại trước khi đánh giá.");
    }
    const note = dto.note.trim();
    const updated = await this.prisma.partnerLead.update({
      where: { id },
      data: {
        assessedTier: dto.tier,
        assessmentNote: note,
        assessedAt: new Date(),
        assessedBy: actorId,
      },
      select: { id: true, assessedTier: true, assessmentNote: true, assessedAt: true },
    });

    // Đã có tài khoản từ yêu cầu này → đồng bộ hạng sang hồ sơ đối tác.
    await this.prisma.partner.updateMany({
      where: { email: lead.email, user: { role: UserRole.PARTNER } },
      data: { gymTier: dto.tier, tierNote: note, tierAssessedAt: new Date() },
    });

    await this.auditService.log({
      userId: actorId,
      action: PARTNER_LEAD_AUDIT.ASSESS,
      entity: "PartnerLead",
      entityId: id,
      metadata: { from: lead.assessedTier, tier: dto.tier, note },
    });
    return updated;
  }

  /** Cập nhật ghi chú nội bộ (không đổi trạng thái — trạng thái đi qua transition). */
  async adminUpdate(id: string, dto: UpdatePartnerLeadDto, actorId: string) {
    await this.findLeadOrThrow(id);
    const notes = dto.notes?.trim() || null;
    const updated = await this.prisma.partnerLead.update({
      where: { id },
      data: { notes },
      select: { id: true, status: true, notes: true, handledAt: true, updatedAt: true },
    });
    await this.auditService.log({
      userId: actorId,
      action: PARTNER_LEAD_AUDIT.NOTE,
      entity: "PartnerLead",
      entityId: id,
      metadata: { note: notes },
    });
    return updated;
  }

  /** Chuyển yêu cầu sang bước tiếp theo — chỉ cho phép đúng thứ tự quy trình. */
  async transition(id: string, dto: TransitionPartnerLeadDto, actorId: string) {
    const lead = await this.findLeadOrThrow(id);
    const from = lead.status as PartnerLeadStatus;
    const to = dto.status;
    const note = dto.note?.trim() || null;

    if (from === to) {
      throw new BadRequestException(
        `Yêu cầu đang ở bước "${PARTNER_LEAD_STATUS_LABELS[to]}".`,
      );
    }
    if (!canTransition(from, to)) {
      throw new BadRequestException(
        `Không thể chuyển từ "${PARTNER_LEAD_STATUS_LABELS[from] ?? from}" sang "${PARTNER_LEAD_STATUS_LABELS[to]}". Hãy xử lý theo đúng thứ tự quy trình.`,
      );
    }
    if (NOTE_REQUIRED_STATUSES.includes(to) && !note) {
      throw new BadRequestException(
        to === "CLOSED"
          ? "Vui lòng ghi lý do đóng yêu cầu."
          : "Vui lòng ghi kết quả chốt hợp tác (gói, phí, ngày bắt đầu...).",
      );
    }
    if (to === "CONVERTED" && lead.direction === "COMMUNITY" && !lead.assessedTier) {
      throw new BadRequestException(
        "Gym Cộng đồng cần được đánh giá hạng phòng (Standard/Plus/Premium) trước khi chốt hợp tác.",
      );
    }

    const updated = await this.prisma.partnerLead.update({
      where: { id },
      data: { status: to, handledBy: actorId, handledAt: new Date() },
      select: { id: true, status: true, notes: true, handledAt: true, updatedAt: true },
    });

    let emailSent: boolean | undefined;
    if (to === "CLOSED" && dto.notifyPartner) {
      emailSent = await this.mailService.sendPartnerLeadClosedEmail({
        email: lead.email,
        contactName: lead.contactName,
        reason: note!,
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: PARTNER_LEAD_AUDIT.STATUS,
      entity: "PartnerLead",
      entityId: id,
      metadata: { from, to, note, emailSent: emailSent ?? null },
    });

    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { fullName: true },
    });
    await this.notificationsService.notifyAdmins(
      {
        type: "SYSTEM",
        title: `Yêu cầu hợp tác: ${PARTNER_LEAD_STATUS_LABELS[to]}`,
        content: `${actor?.fullName ?? "Quản trị viên"} chuyển yêu cầu của ${lead.contactName} sang "${PARTNER_LEAD_STATUS_LABELS[to]}".${note ? ` Ghi chú: ${note}` : ""}`,
        link: "/admin/partner-leads",
        referenceType: "PARTNER_LEAD_STATUS",
      },
      actorId,
    );

    return { ...updated, emailSent };
  }

  /** Lịch sử xử lý của một yêu cầu: lúc gửi + từng lần chuyển bước / ghi chú / tạo tài khoản. */
  async history(id: string) {
    const lead = await this.findLeadOrThrow(id);
    const logs = await this.prisma.auditLog.findMany({
      where: { entity: "PartnerLead", entityId: id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        action: true,
        metadata: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });
    const parse = (raw: string | null): Record<string, unknown> => {
      try {
        return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } catch {
        return {};
      }
    };
    return [
      {
        id: `created-${lead.id}`,
        action: "PARTNER_LEAD_CREATED",
        actorName: lead.contactName,
        at: lead.createdAt,
        from: null,
        to: "NEW",
        note: lead.message,
      },
      ...logs.map((log) => {
        const meta = parse(log.metadata);
        return {
          id: log.id,
          action: log.action,
          actorName: log.user?.fullName ?? "Hệ thống",
          at: log.createdAt,
          from: (meta.from as string) ?? null,
          to: (meta.to as string) ?? null,
          note: (meta.note as string) ?? (meta.businessName as string) ?? null,
          emailSent: (meta.emailSent as boolean | null) ?? null,
          tier: (meta.tier as string) ?? null,
        };
      }),
    ];
  }

  async createPartnerAccount(
    leadId: string,
    businessName: string,
    actorId: string,
    termMonths = 1,
  ) {
    const lead = await this.prisma.partnerLead.findUnique({
      where: { id: leadId },
    });
    if (!lead) throw new NotFoundException("Không tìm thấy yêu cầu hợp tác.");
    if (lead.status !== "CONVERTED") {
      throw new BadRequestException(
        "Chỉ tạo tài khoản sau khi đã chốt hợp đồng và cập nhật trạng thái Đã hợp tác.",
      );
    }
    if (
      await this.prisma.user.findUnique({
        where: { email: lead.email },
        select: { id: true },
      })
    ) {
      throw new ConflictException(
        "Email này đã có tài khoản. Hãy kiểm tra mục Đối tác phòng gym.",
      );
    }
    if (
      lead.phone &&
      (await this.prisma.user.findFirst({
        where: { phone: lead.phone },
        select: { id: true },
      }))
    ) {
      throw new ConflictException(
        "Số điện thoại này đã gắn với tài khoản khác. Hãy cập nhật số liên hệ trước khi tạo tài khoản.",
      );
    }

    // Chốt loại hợp tác + giá theo bảng giá hiện hành, hợp đồng tính từ hôm nay.
    const plan = await this.prisma.partnershipPlan.findUnique({
      where: { code: lead.direction },
    });
    const contractStartAt = new Date();
    const contractEndAt = new Date(contractStartAt);
    contractEndAt.setMonth(contractEndAt.getMonth() + termMonths);

    const temporaryPassword = randomBytes(12).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: lead.email,
          passwordHash,
          fullName: lead.contactName,
          phone: lead.phone || null,
          role: UserRole.PARTNER,
          status: UserStatus.ACTIVE,
          mustChangePassword: true,
        },
        select: { id: true, email: true },
      });
      const partner = await tx.partner.create({
        data: {
          userId: user.id,
          businessName: businessName.trim(),
          phone: lead.phone,
          email: lead.email,
          address: lead.address,
          status: "APPROVED",
          // Hạng phòng do admin đánh giá từ ảnh cơ sở vật chất → áp dụng khi check-in
          gymTier: lead.assessedTier,
          tierNote: lead.assessmentNote,
          tierAssessedAt: lead.assessedTier ? (lead.assessedAt ?? new Date()) : null,
          partnershipType: lead.direction,
          monthlyFee: plan?.monthlyPrice ?? null,
          contractStartAt,
          contractEndAt,
        },
        select: { id: true, businessName: true },
      });
      await tx.partnerBranch.create({
        data: {
          partnerId: partner.id,
          name: businessName.trim(),
          address: lead.address,
          phone: lead.phone,
        },
      });
      return { user, partner };
    });

    await this.auditService.log({
      userId: actorId,
      action: "PARTNER_APPROVE",
      entity: "Partner",
      entityId: created.partner.id,
      metadata: {
        email: lead.email,
        businessName: created.partner.businessName,
        source: "PARTNER_LEAD",
      },
    });
    await this.auditService.log({
      userId: actorId,
      action: PARTNER_LEAD_AUDIT.ACCOUNT,
      entity: "PartnerLead",
      entityId: lead.id,
      metadata: {
        partnerId: created.partner.id,
        businessName: created.partner.businessName,
      },
    });

    const emailSent = await this.mailService.sendPartnerAccountCreatedEmail({
      email: lead.email,
      contactName: lead.contactName,
      businessName: created.partner.businessName,
      temporaryPassword,
      loginUrl: `${process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000"}/login`,
    });

    return {
      message: emailSent
        ? "Đã tạo tài khoản đối tác và gửi thông tin đăng nhập qua email."
        : "Đã tạo tài khoản nhưng chưa gửi được email. Hãy sao chép mật khẩu tạm thời để gửi cho đối tác.",
      partnerId: created.partner.id,
      emailSent,
      ...(!emailSent ? { temporaryPassword } : {}),
    };
  }
}
