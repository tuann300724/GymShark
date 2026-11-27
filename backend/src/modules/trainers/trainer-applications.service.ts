import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../mail/mail.service";
import { TrainerStatus, UserRole, UserStatus } from "../../common/constants/db-enums";
import {
  CreateTrainerApplicationDto,
  TrainerApplicationQueryDto,
} from "./dto/trainer-application.dto";
import { TrainerReviewDto } from "./dto/trainer.dto";
import { isAvatarDataUrl, saveUserAvatar } from "../../common/utils/avatar";

const frontendBase = () =>
  process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";

/**
 * Đơn đăng ký PT tự do (giống luồng đối tác): PT gửi thông tin + ảnh bằng cấp, CHƯA có tài khoản.
 * Admin duyệt → tạo User TRAINER + Trainer ACTIVE, gửi mật khẩu tạm qua email.
 * Admin từ chối → email lý do, PT có thể gửi đơn mới.
 */
@Injectable()
export class TrainerApplicationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  /** Công khai: gửi đơn đăng ký làm PT */
  async create(dto: CreateTrainerApplicationDto, ip?: string) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone.replace(/\s+/g, "");

    const [emailUser, phoneUser, pending] = await Promise.all([
      this.prisma.user.findFirst({ where: { email }, select: { id: true } }),
      this.prisma.user.findFirst({ where: { phone }, select: { id: true } }),
      this.prisma.trainerApplication.findFirst({
        where: { status: "PENDING", OR: [{ email }, { phone }] },
        select: { id: true },
      }),
    ]);
    if (emailUser)
      throw new ConflictException(
        "Email này đã có tài khoản trên GymMaster. Vui lòng dùng email khác.",
      );
    if (phoneUser)
      throw new ConflictException("Số điện thoại đã được dùng cho tài khoản khác.");
    if (pending)
      throw new ConflictException(
        "Bạn đã có một đơn đăng ký đang chờ duyệt. Kết quả sẽ được gửi qua email.",
      );

    const application = await this.prisma.trainerApplication.create({
      data: {
        fullName: dto.fullName.trim(),
        email,
        phone,
        gender: dto.gender ?? null,
        specialization: dto.specialization.trim(),
        certification: dto.certification?.trim() || null,
        experienceYears: dto.experienceYears,
        bio: dto.bio.trim(),
        hourlyRate: dto.hourlyRate ?? null,
        avatarUrl: dto.avatarUrl?.trim() || null,
        ip: ip ?? null,
        documents: {
          create: dto.documents.map((doc, index) => ({
            caption: doc.caption?.trim() || null,
            dataUrl: doc.dataUrl,
            sortOrder: index,
          })),
        },
      },
      select: { id: true, fullName: true, specialization: true },
    });

    await this.notificationsService.notifyAdmins({
      type: "SYSTEM",
      title: "Có đơn đăng ký PT mới",
      content: `${application.fullName} (${application.specialization}) gửi đơn làm huấn luyện viên kèm ${dto.documents.length} ảnh bằng cấp, cần duyệt.`,
      link: "/admin/trainer-applications",
      referenceType: "TRAINER_APPLICATION",
      referenceId: application.id,
    });

    const emailSent = await this.mailService.sendTrainerApplicationEmail({
      status: "RECEIVED",
      email,
      fullName: application.fullName,
      link: frontendBase(),
    });

    return {
      message:
        "Đã gửi đơn đăng ký. GymMaster sẽ thẩm định hồ sơ và gửi kết quả cùng thông tin đăng nhập qua email.",
      id: application.id,
      emailSent,
    };
  }

  /** Admin: danh sách đơn (không kèm dữ liệu ảnh, chỉ số lượng) */
  async list(query: TrainerApplicationQueryDto) {
    const status = query.status ?? "PENDING";
    const [data, counts] = await Promise.all([
      this.prisma.trainerApplication.findMany({
        where: { status },
        include: { _count: { select: { documents: true } } },
        orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
        take: 100,
      }),
      this.prisma.trainerApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
    return {
      data,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    };
  }

  /** Admin: ảnh bằng cấp của một đơn */
  async documents(id: string) {
    await this.findOrThrow(id);
    return this.prisma.trainerApplicationDocument.findMany({
      where: { applicationId: id },
      select: { id: true, caption: true, dataUrl: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  /** Admin duyệt (tạo tài khoản PT) hoặc từ chối đơn */
  async review(id: string, dto: TrainerReviewDto, actorId: string) {
    const app = await this.findOrThrow(id);
    if (app.status !== "PENDING")
      throw new BadRequestException("Đơn này đã được xử lý.");
    const reason = dto.reason?.trim() || null;
    if (!dto.approved && !reason)
      throw new BadRequestException("Vui lòng nhập lý do từ chối để PT biết cần bổ sung gì.");

    if (!dto.approved) {
      await this.prisma.trainerApplication.update({
        where: { id },
        data: { status: "REJECTED", rejectReason: reason, reviewedAt: new Date(), reviewedById: actorId },
      });
      await this.auditService.log({
        userId: actorId,
        action: "TRAINER_APPLICATION_REJECT",
        entity: "TrainerApplication",
        entityId: id,
        metadata: { email: app.email, reason },
      });
      const emailSent = await this.mailService.sendTrainerApplicationEmail({
        status: "REJECTED",
        email: app.email,
        fullName: app.fullName,
        reason,
        link: `${frontendBase()}/trainers/register`,
      });
      return { message: `Đã từ chối đơn của ${app.fullName}.`, emailSent };
    }

    // Duyệt → tạo tài khoản. Kiểm tra lại trùng (có thể email/SĐT được dùng sau khi gửi đơn)
    const [emailUser, phoneUser] = await Promise.all([
      this.prisma.user.findFirst({ where: { email: app.email }, select: { id: true } }),
      this.prisma.user.findFirst({ where: { phone: app.phone }, select: { id: true } }),
    ]);
    if (emailUser)
      throw new ConflictException("Email này đã có tài khoản. Không thể tạo tài khoản PT.");
    if (phoneUser)
      throw new ConflictException("Số điện thoại đã gắn với tài khoản khác. Không thể tạo tài khoản PT.");

    const temporaryPassword = randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const trainer = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: app.email,
          passwordHash,
          fullName: app.fullName,
          phone: app.phone,
          role: UserRole.TRAINER,
          status: UserStatus.ACTIVE,
          mustChangePassword: true,
        },
        select: { id: true },
      });
      // Ảnh đại diện PT tải lên khi gửi đơn → lưu UserAvatar, User.avatarUrl giữ link ngắn
      if (isAvatarDataUrl(app.avatarUrl)) {
        await tx.user.update({
          where: { id: user.id },
          data: { avatarUrl: await saveUserAvatar(tx, user.id, app.avatarUrl) },
        });
      }
      const created = await tx.trainer.create({
        data: {
          userId: user.id,
          source: "SELF",
          status: TrainerStatus.ACTIVE,
          specialization: app.specialization,
          certification: app.certification,
          experienceYears: app.experienceYears,
          bio: app.bio,
          gender: app.gender,
          hourlyRate: app.hourlyRate,
        },
        select: { id: true },
      });
      await tx.trainerApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          rejectReason: null,
          reviewedAt: new Date(),
          reviewedById: actorId,
          trainerId: created.id,
        },
      });
      return created;
    });

    await this.auditService.log({
      userId: actorId,
      action: "TRAINER_APPLICATION_APPROVE",
      entity: "TrainerApplication",
      entityId: id,
      metadata: { email: app.email, trainerId: trainer.id },
    });

    const emailSent = await this.mailService.sendTrainerApplicationEmail({
      status: "APPROVED",
      email: app.email,
      fullName: app.fullName,
      temporaryPassword,
      link: `${frontendBase()}/login`,
    });

    return {
      message: emailSent
        ? `Đã duyệt và tạo tài khoản PT cho ${app.fullName}. Thông tin đăng nhập đã gửi qua email.`
        : `Đã tạo tài khoản PT cho ${app.fullName} nhưng chưa gửi được email. Hãy gửi mật khẩu tạm cho PT.`,
      trainerId: trainer.id,
      emailSent,
      ...(!emailSent ? { temporaryPassword } : {}),
    };
  }

  private async findOrThrow(id: string) {
    const app = await this.prisma.trainerApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Không tìm thấy đơn đăng ký PT.");
    return app;
  }
}
