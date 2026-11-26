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
import { UpdatePartnerLeadDto } from "./dto/update-partner-lead.dto";
import { MailService } from "../mail/mail.service";
import { UserRole, UserStatus } from "../../common/constants/db-enums";
import { AuditService } from "../audit-logs/audit-logs.service";

@Injectable()
export class PartnerLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePartnerLeadDto, ip?: string) {
    const lead = await this.prisma.partnerLead.create({
      data: {
        direction: dto.direction,
        contactName: dto.contactName.trim(),
        address: dto.address?.trim() || null,
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone.trim(),
        message: dto.message?.trim() || null,
        ip: ip || null,
      },
      select: { id: true, contactName: true, createdAt: true },
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
    const where = {
      ...(query.status ? { status: query.status } : {}),
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

    const [data, total] = await this.prisma.$transaction([
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
          createdAt: true,
        },
      }),
      this.prisma.partnerLead.count({ where }),
    ]);

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
    };
  }

  async adminUpdate(id: string, dto: UpdatePartnerLeadDto, actorId: string) {
    const existing = await this.prisma.partnerLead.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing)
      throw new NotFoundException("Không tìm thấy yêu cầu hợp tác.");

    return this.prisma.partnerLead.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes.trim() || null } : {}),
        ...(dto.status && dto.status !== "NEW"
          ? { handledBy: actorId, handledAt: new Date() }
          : {}),
      },
      select: {
        id: true,
        status: true,
        notes: true,
        handledAt: true,
        updatedAt: true,
      },
    });
  }

  async createPartnerAccount(
    leadId: string,
    businessName: string,
    actorId: string,
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
