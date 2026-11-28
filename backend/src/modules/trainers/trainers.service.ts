import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  TrainerStatus,
  UserRole,
  UserStatus,
} from "../../common/constants/db-enums";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import { assertInScope, ownerWhere, type OwnerScope } from "../../common/utils/partner-scope";
import {
  CreateTrainerDto,
  TrainerQueryDto,
  TrainerReviewDto,
  UpdateMyTrainerProfileDto,
  UpdateTrainerDto,
  UpdateTrainerWorkAreaDto,
} from "./dto/trainer.dto";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { MailService } from "../mail/mail.service";
import { isAvatarDataUrl, saveUserAvatar } from "../../common/utils/avatar";
import {
  PAYOUT_BANK_SELECT,
  toPayoutBankData,
  type UpdatePayoutBankDto,
} from "../../common/utils/payout-bank";

/** Các field hồ sơ công khai PT tự sửa (bản nháp chờ duyệt lưu đúng các key này) */
type ProfileDraft = Partial<{
  specialization: string;
  certification: string | null;
  experienceYears: number;
  bio: string | null;
  avatarUrl: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  hourlyRate: number | null;
}>;

const PROFILE_KEYS = [
  "specialization",
  "certification",
  "experienceYears",
  "bio",
  "avatarUrl",
  "gender",
  "dateOfBirth",
  "hourlyRate",
] as const;

const frontendBase = () =>
  process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";

/** Mật khẩu mặc định cho tài khoản HLV mới do admin tạo (trả về 1 lần khi tạo) */
export const DEFAULT_TRAINER_PASSWORD = "Trainer@123456";

@Injectable()
export class TrainersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async resolveTrainerByUserId(userId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
      },
    });
    if (!trainer)
      throw new ForbiddenException(
        "Tài khoản này không gắn với hồ sơ huấn luyện viên.",
      );
    return trainer;
  }

  private async checkEmailAvailable(email: string, excludeUserId?: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });
    if (user)
      throw new ConflictException("Email đã được sử dụng bởi tài khoản khác.");
  }

  // ---------------------------------------------------------------------------
  // List / Detail
  // ---------------------------------------------------------------------------

  async findAll(query: TrainerQueryDto = {}, scope: OwnerScope = null) {
    const { page = 1, limit = 20, search, status, specialization } = query;
    const skip = (page - 1) * limit;

    // Đối tác chỉ thấy PT của phòng mình; hệ thống chỉ thấy PT Gym Master
    const where: any = { ...ownerWhere(scope) };
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
      ];
    }
    if (status) where.status = status;
    if (specialization) where.specialization = { contains: specialization };

    const [data, total] = await Promise.all([
      this.prisma.trainer.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
          _count: {
            select: {
              trainerMembers: { where: { status: "ACTIVE" } },
              schedules: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.trainer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, scope: OwnerScope = null) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
        trainerMembers: {
          include: {
            member: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
                memberships: {
                  where: { status: "ACTIVE" },
                  include: { package: { select: { id: true, name: true } } },
                  orderBy: { endDate: "desc" },
                  take: 1,
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        schedules: {
          include: {
            member: {
              select: { id: true, code: true, fullName: true, phone: true },
            },
            room: { select: { id: true, name: true } },
          },
          orderBy: { startTime: "desc" },
          take: 50,
        },
      },
    });

    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(trainer.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");

    const now = new Date();
    const [totalSessions, activeMembers, upcomingSessions, completedSessions] =
      await Promise.all([
        this.prisma.trainingSchedule.count({ where: { trainerId: id } }),
        this.prisma.trainerMember.count({
          where: { trainerId: id, status: "ACTIVE" },
        }),
        this.prisma.trainingSchedule.count({
          where: {
            trainerId: id,
            status: "SCHEDULED",
            startTime: { gte: now },
          },
        }),
        this.prisma.trainingSchedule.count({
          where: { trainerId: id, status: "COMPLETED" },
        }),
      ]);

    return {
      ...trainer,
      stats: {
        totalSessions,
        activeMembers,
        upcomingSessions,
        completedSessions,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  async create(dto: CreateTrainerDto, actorId?: string, scope: OwnerScope = null) {
    await this.checkEmailAvailable(dto.email);

    const passwordHash = await bcrypt.hash(DEFAULT_TRAINER_PASSWORD, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone ?? null,
          role: UserRole.TRAINER,
          ownerPartnerId: scope,
          mustChangePassword: true,
          status:
            dto.status === TrainerStatus.INACTIVE
              ? UserStatus.INACTIVE
              : UserStatus.ACTIVE,
          avatarUrl: dto.avatarUrl ?? null,
        },
      });

      const trainer = await tx.trainer.create({
        data: {
          ownerPartnerId: scope,
          userId: user.id,
          specialization: dto.specialization,
          certification: dto.certification ?? null,
          experienceYears: dto.experienceYears ?? 1,
          bio: dto.bio ?? null,
          gender: dto.gender ?? null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          hourlyRate: dto.hourlyRate ?? null,
          // Chiết khấu chỉ áp dụng PT hệ thống (đối tác không tự đặt % của GymMaster)
          ...(scope === null && dto.commissionRate !== undefined
            ? { commissionRate: dto.commissionRate }
            : {}),
          status: dto.status ?? TrainerStatus.ACTIVE,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
      });

      return { trainer, user };
    });

    await this.auditService.log({
      userId: actorId,
      action: "TRAINER_CREATE",
      entity: "Trainer",
      entityId: result.trainer.id,
      metadata: {
        fullName: dto.fullName,
        email: dto.email,
        specialization: dto.specialization,
      },
    });

    return {
      message: "Tạo huấn luyện viên thành công.",
      trainer: result.trainer,
      tempPassword: DEFAULT_TRAINER_PASSWORD,
    };
  }

  async update(id: string, dto: UpdateTrainerDto, actorId?: string, scope: OwnerScope = null) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(trainer.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");

    const userData: any = {};
    if (dto.email) {
      await this.checkEmailAvailable(dto.email, trainer.userId);
      userData.email = dto.email;
    }
    if (dto.fullName !== undefined) userData.fullName = dto.fullName;
    if (dto.phone !== undefined) userData.phone = dto.phone;
    if (dto.avatarUrl !== undefined) userData.avatarUrl = dto.avatarUrl;
    // Đồng bộ trạng thái khóa tài khoản theo trạng thái HLV
    if (dto.status !== undefined) {
      userData.status =
        dto.status === TrainerStatus.INACTIVE
          ? UserStatus.INACTIVE
          : UserStatus.ACTIVE;
    }

    const trainerData: any = {};
    if (dto.specialization !== undefined)
      trainerData.specialization = dto.specialization;
    if (dto.certification !== undefined)
      trainerData.certification = dto.certification;
    if (dto.experienceYears !== undefined)
      trainerData.experienceYears = dto.experienceYears;
    if (dto.bio !== undefined) trainerData.bio = dto.bio;
    if (dto.gender !== undefined) trainerData.gender = dto.gender;
    if (dto.dateOfBirth !== undefined)
      trainerData.dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : null;
    if (dto.hourlyRate !== undefined) trainerData.hourlyRate = dto.hourlyRate;
    if (dto.commissionRate !== undefined && scope === null)
      trainerData.commissionRate = dto.commissionRate;
    if (dto.status !== undefined) trainerData.status = dto.status;

    const updated = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: trainer.userId },
        data: userData,
      }),
      this.prisma.trainer.update({
        where: { id },
        data: trainerData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phone: true,
              avatarUrl: true,
              status: true,
            },
          },
        },
      }),
    ]);

    await this.auditService.log({
      userId: actorId,
      action: "TRAINER_UPDATE",
      entity: "Trainer",
      entityId: id,
      metadata: { fields: Object.keys({ ...userData, ...trainerData }) },
    });

    return {
      message: "Cập nhật huấn luyện viên thành công.",
      trainer: updated[1],
    };
  }

  /** Deactivate (soft delete) — giữ lịch sử, chỉ chuyển trạng thái INACTIVE */
  async remove(id: string, actorId?: string, scope: OwnerScope = null) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(trainer.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: trainer.userId },
        data: { status: UserStatus.INACTIVE },
      }),
      this.prisma.trainer.update({
        where: { id },
        data: { status: TrainerStatus.INACTIVE },
      }),
    ]);

    await this.auditService.log({
      userId: actorId,
      action: "TRAINER_REMOVE",
      entity: "Trainer",
      entityId: id,
      metadata: { softDeleted: true },
    });

    return {
      message: "Đã ngừng hoạt động huấn luyện viên. Lịch sử được giữ lại.",
    };
  }

  // ---------------------------------------------------------------------------
  // Assignments (Trainer ↔ Member)
  // ---------------------------------------------------------------------------

  async getMembers(trainerId: string, scope: OwnerScope = null) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
    });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(trainer.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");

    return this.prisma.trainerMember.findMany({
      where: { trainerId },
      include: {
        member: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            memberships: {
              where: { status: "ACTIVE" },
              include: { package: { select: { id: true, name: true } } },
              orderBy: { endDate: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async assignMember(trainerId: string, memberId: string, scope: OwnerScope = null) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { user: { select: { fullName: true } } },
    });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(trainer.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");
    if (trainer.status !== TrainerStatus.ACTIVE) {
      throw new BadRequestException(
        "Huấn luyện viên đang không hoạt động, không thể gán hội viên mới.",
      );
    }

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException("Không tìm thấy hội viên.");
    // PT và hội viên phải cùng một phòng gym (hệ thống hoặc cùng đối tác)
    assertInScope(member.ownerPartnerId, scope, "Không tìm thấy hội viên.");
    if (member.status !== "ACTIVE") {
      throw new BadRequestException(
        "Hội viên đang không hoạt động, không thể gán huấn luyện viên.",
      );
    }

    const existing = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: "ACTIVE" },
    });
    if (existing) {
      throw new ConflictException(
        "Hội viên này đã được gán cho huấn luyện viên này.",
      );
    }

    const otherActive = await this.prisma.trainerMember.findFirst({
      where: { memberId, status: "ACTIVE", trainerId: { not: trainerId } },
      include: {
        trainer: { include: { user: { select: { fullName: true } } } },
      },
    });
    if (otherActive) {
      throw new ConflictException(
        `Hội viên đang được HLV ${otherActive.trainer.user.fullName} phụ trách. Hãy kết thúc phân công cũ trước.`,
      );
    }

    // Mở lại phân công cũ cùng cặp (nếu có) thay vì tạo trùng lịch sử
    const history = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId },
      orderBy: { createdAt: "desc" },
    });
    const assignmentId = await this.prisma.$transaction(async (tx) => {
      const assignment = history
        ? await tx.trainerMember.update({
            where: { id: history.id },
            data: { status: "ACTIVE", startDate: new Date(), endDate: null },
          })
        : await tx.trainerMember.create({
            data: { trainerId, memberId, status: "ACTIVE" },
          });
      await this.notificationsService.createTx(tx, {
        memberId,
        type: "MEMBERSHIP",
        title: "Bạn đã được phân công huấn luyện viên",
        content: `Huấn luyện viên ${trainer.user.fullName}${trainer.specialization ? ` (${trainer.specialization})` : ""} đang phụ trách hỗ trợ bạn. Xem thông tin tại trang Gói tập của tôi.`,
        link: "/member/membership",
        referenceType: "TRAINER_ASSIGNMENT",
        referenceId: `${assignment.id}:${assignment.startDate.getTime()}`,
        data: { trainerId, assignmentId: assignment.id },
      });
      return assignment.id;
    });

    return {
      message: "Đã gán huấn luyện viên cho hội viên.",
      assignment: await this.getAssignmentDetail(assignmentId),
    };
  }

  async unassignMember(trainerId: string, memberId: string, scope: OwnerScope = null) {
    const owner = await this.prisma.trainer.findUnique({ where: { id: trainerId }, select: { ownerPartnerId: true } });
    if (!owner) throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    assertInScope(owner.ownerPartnerId, scope, "Không tìm thấy huấn luyện viên.");
    const assignment = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: "ACTIVE" },
    });
    if (!assignment) {
      throw new BadRequestException(
        "Không có phân công đang hoạt động giữa HLV và hội viên này.",
      );
    }

    await this.prisma.trainerMember.update({
      where: { id: assignment.id },
      data: { status: "INACTIVE", endDate: new Date() },
    });

    return { message: "Đã kết thúc phân công huấn luyện viên cho hội viên." };
  }

  private async getAssignmentDetail(id: string) {
    return this.prisma.trainerMember.findUnique({
      where: { id },
      include: {
        trainer: {
          include: { user: { select: { fullName: true, avatarUrl: true } } },
        },
        member: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
            memberships: {
              where: { status: "ACTIVE" },
              include: { package: { select: { id: true, name: true } } },
              orderBy: { endDate: "desc" },
              take: 1,
            },
          },
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Trainer self
  // ---------------------------------------------------------------------------

  /** HLV đang đăng nhập xem danh sách hội viên được phụ trách */
  async getMyMembers(userId: string) {
    const trainer = await this.resolveTrainerByUserId(userId);
    return this.getMembers(trainer.id);
  }

  /** HLV đang đăng nhập xem hồ sơ + thống kê của chính mình */
  async getMyProfile(userId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });
    if (!trainer)
      throw new ForbiddenException(
        "Tài khoản này không gắn với hồ sơ huấn luyện viên.",
      );

    const now = new Date();
    const [totalSessions, activeMembers, upcomingSessions, completedSessions] =
      await Promise.all([
        this.prisma.trainingSchedule.count({
          where: { trainerId: trainer.id },
        }),
        this.prisma.trainerMember.count({
          where: { trainerId: trainer.id, status: "ACTIVE" },
        }),
        this.prisma.trainingSchedule.count({
          where: {
            trainerId: trainer.id,
            status: "SCHEDULED",
            startTime: { gte: now },
          },
        }),
        this.prisma.trainingSchedule.count({
          where: { trainerId: trainer.id, status: "COMPLETED" },
        }),
      ]);

    return {
      ...trainer,
      pendingProfile: this.parseDraft(trainer.pendingProfile),
      stats: {
        totalSessions,
        activeMembers,
        upcomingSessions,
        completedSessions,
      },
    };
  }

  /**
   * HLV tự chỉnh hồ sơ công khai + giá kèm riêng theo buổi.
   * - PT của hệ thống: lưu thành BẢN NHÁP chờ admin duyệt, hồ sơ công khai giữ nguyên.
   * - PT riêng của phòng gym đối tác: không hiển thị trên GymMaster nên áp dụng ngay.
   */
  async updateMyProfile(userId: string, dto: UpdateMyTrainerProfileDto) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
    if (!trainer)
      throw new ForbiddenException(
        "Tài khoản này không gắn với hồ sơ huấn luyện viên.",
      );

    const input = this.normalizeProfileInput(dto);

    if (trainer.ownerPartnerId) {
      const { trainerData, userData } = this.toProfileData(input);
      await this.persistUploadedAvatar(trainer.userId, userData);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: trainer.userId }, data: userData }),
        this.prisma.trainer.update({ where: { id: trainer.id }, data: trainerData }),
      ]);
      await this.auditService.log({
        userId,
        action: "TRAINER_UPDATE",
        entity: "Trainer",
        entityId: trainer.id,
        metadata: { fields: Object.keys(input), source: "SELF" },
      });
      return {
        message: "Đã cập nhật hồ sơ huấn luyện viên.",
        mode: "DIRECT",
        trainer: await this.getMyProfile(userId),
      };
    }

    // So với hồ sơ đang hiển thị — chỉ lưu các field thật sự thay đổi
    const current = this.currentProfile(trainer);
    const draft: Record<string, unknown> = {};
    for (const key of PROFILE_KEYS) {
      if (!(key in input)) continue;
      if (JSON.stringify(input[key]) !== JSON.stringify(current[key])) {
        draft[key] = input[key];
      }
    }
    if (Object.keys(draft).length === 0) {
      throw new BadRequestException(
        "Không có thay đổi nào so với hồ sơ đang hiển thị công khai.",
      );
    }

    const submittedAt = new Date();
    await this.prisma.trainer.update({
      where: { id: trainer.id },
      data: {
        pendingProfile: JSON.stringify(draft),
        profileReviewStatus: "PENDING",
        profileSubmittedAt: submittedAt,
        profileReviewedAt: null,
        profileRejectReason: null,
      },
    });

    await this.auditService.log({
      userId,
      action: "TRAINER_PROFILE_SUBMIT",
      entity: "Trainer",
      entityId: trainer.id,
      metadata: { fields: Object.keys(draft) },
    });
    await this.notificationsService.notifyAdmins({
      type: "SYSTEM",
      title: "PT gửi chỉnh sửa hồ sơ",
      content: `${trainer.user.fullName} vừa gửi chỉnh sửa hồ sơ công khai, cần duyệt trước khi hiển thị.`,
      link: "/admin/trainer-applications",
      referenceType: "TRAINER_PROFILE_CHANGE",
      referenceId: `${trainer.id}:${submittedAt.getTime()}`,
    });

    return {
      message:
        "Đã gửi chỉnh sửa hồ sơ. Nội dung mới sẽ hiển thị công khai sau khi quản trị viên duyệt.",
      mode: "DRAFT",
      trainer: await this.getMyProfile(userId),
    };
  }

  /** PT xem khu vực dạy của mình (toạ độ chính xác — chỉ chính chủ thấy) */
  async getMyWorkArea(userId: string) {
    const trainer = await this.resolveTrainerByUserId(userId);
    return this.prisma.trainer.findUnique({
      where: { id: trainer.id },
      select: { workAddress: true, workLatitude: true, workLongitude: true },
    });
  }

  /** PT tự cập nhật khu vực dạy — áp dụng ngay, không cần duyệt (trang công khai chỉ lộ ~1 km) */
  async updateMyWorkArea(userId: string, dto: UpdateTrainerWorkAreaDto) {
    const trainer = await this.resolveTrainerByUserId(userId);
    const address = dto.workAddress?.trim() || null;
    const hasPin = dto.workLatitude != null && dto.workLongitude != null;
    const area = await this.prisma.trainer.update({
      where: { id: trainer.id },
      data: {
        workAddress: address,
        workLatitude: hasPin ? dto.workLatitude : null,
        workLongitude: hasPin ? dto.workLongitude : null,
      },
      select: { workAddress: true, workLatitude: true, workLongitude: true },
    });
    await this.auditService.log({
      userId,
      action: "TRAINER_WORK_AREA_UPDATE",
      entity: "Trainer",
      entityId: trainer.id,
      metadata: { hasAddress: Boolean(address), hasPin },
    });
    return { message: "Đã lưu khu vực dạy.", area };
  }

  /** PT xem tài khoản nhận tiền (STK + QR) của mình */
  async getMyBank(userId: string) {
    const trainer = await this.resolveTrainerByUserId(userId);
    return this.prisma.trainer.findUnique({
      where: { id: trainer.id },
      select: PAYOUT_BANK_SELECT,
    });
  }

  /** PT tự cập nhật tài khoản nhận tiền buổi tập (admin chuyển khoản theo thông tin này) */
  async updateMyBank(userId: string, dto: UpdatePayoutBankDto) {
    const trainer = await this.resolveTrainerByUserId(userId);
    const bank = await this.prisma.trainer.update({
      where: { id: trainer.id },
      data: toPayoutBankData(dto),
      select: PAYOUT_BANK_SELECT,
    });
    await this.auditService.log({
      userId,
      action: "PAYOUT_BANK_UPDATE",
      entity: "Trainer",
      entityId: trainer.id,
      metadata: {
        bankCode: bank.bankCode,
        accountTail: bank.bankAccountNumber?.slice(-4) ?? null,
        hasQrImage: Boolean(bank.bankQrImage),
      },
    });
    return { message: "Đã lưu tài khoản nhận tiền.", bank };
  }

  /** HLV huỷ bản chỉnh sửa hồ sơ đang chờ duyệt */
  async cancelMyProfileDraft(userId: string) {
    const trainer = await this.resolveTrainerByUserId(userId);
    if (trainer.profileReviewStatus !== "PENDING") {
      throw new BadRequestException("Không có chỉnh sửa hồ sơ nào đang chờ duyệt.");
    }
    await this.prisma.trainer.update({
      where: { id: trainer.id },
      data: { pendingProfile: null, profileReviewStatus: null, profileSubmittedAt: null },
    });
    return { message: "Đã huỷ bản chỉnh sửa hồ sơ đang chờ duyệt." };
  }

  // ---------------------------------------------------------------------------
  // Admin duyệt chỉnh sửa hồ sơ (đơn đăng ký PT mới: xem TrainerApplicationsService)
  // ---------------------------------------------------------------------------

  /** Admin: các bản chỉnh sửa hồ sơ công khai đang chờ duyệt (PT của hệ thống) */
  async getProfileChanges() {
    const rows = await this.prisma.trainer.findMany({
      where: { profileReviewStatus: "PENDING", ownerPartnerId: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
      orderBy: { profileSubmittedAt: "asc" },
    });
    return rows.map((t) => ({
      ...t,
      pendingProfile: this.parseDraft(t.pendingProfile),
      currentProfile: this.currentProfile(t),
    }));
  }

  /** Admin duyệt / từ chối bản chỉnh sửa hồ sơ công khai của PT */
  async reviewProfileChange(id: string, dto: TrainerReviewDto, actorId?: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
    if (!trainer || trainer.ownerPartnerId)
      throw new NotFoundException("Không tìm thấy hồ sơ huấn luyện viên.");
    if (trainer.profileReviewStatus !== "PENDING" || !trainer.pendingProfile)
      throw new BadRequestException("PT này không có chỉnh sửa hồ sơ nào đang chờ duyệt.");
    const reason = this.requireReason(dto);
    const draft = this.parseDraft(trainer.pendingProfile) ?? {};
    const reviewedAt = new Date();

    if (dto.approved) {
      const { trainerData, userData } = this.toProfileData(draft);
      await this.persistUploadedAvatar(trainer.userId, userData);
      await this.prisma.$transaction([
        this.prisma.user.update({ where: { id: trainer.userId }, data: userData }),
        this.prisma.trainer.update({
          where: { id },
          data: {
            ...trainerData,
            pendingProfile: null,
            profileReviewStatus: "APPROVED",
            profileReviewedAt: reviewedAt,
            profileRejectReason: null,
          },
        }),
      ]);
    } else {
      // Giữ bản nháp để PT thấy nội dung bị từ chối và sửa tiếp
      await this.prisma.trainer.update({
        where: { id },
        data: {
          profileReviewStatus: "REJECTED",
          profileReviewedAt: reviewedAt,
          profileRejectReason: reason,
        },
      });
    }

    await this.auditService.log({
      userId: actorId,
      action: dto.approved ? "TRAINER_PROFILE_APPROVE" : "TRAINER_PROFILE_REJECT",
      entity: "Trainer",
      entityId: id,
      metadata: { fields: Object.keys(draft), ...(reason ? { reason } : {}) },
    });

    const link = "/trainer/profile";
    await this.notificationsService.create({
      userId: trainer.userId,
      type: "SYSTEM",
      title: dto.approved
        ? "Chỉnh sửa hồ sơ đã được duyệt ✅"
        : "Chỉnh sửa hồ sơ chưa được duyệt",
      content: dto.approved
        ? "Nội dung hồ sơ mới của bạn đã hiển thị công khai."
        : `Chỉnh sửa hồ sơ của bạn bị từ chối. Lý do: ${reason}.`,
      link,
    });
    void this.mailService.sendTrainerProfileReviewEmail({
      email: trainer.user.email,
      fullName: trainer.user.fullName,
      approved: dto.approved,
      reason,
      link: `${frontendBase()}${link}`,
    });

    return {
      message: dto.approved
        ? `Đã duyệt chỉnh sửa hồ sơ của ${trainer.user.fullName}.`
        : `Đã từ chối chỉnh sửa hồ sơ của ${trainer.user.fullName}.`,
      emailSent: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers cho bản nháp hồ sơ
  // ---------------------------------------------------------------------------

  /** Ảnh đại diện dạng data URL → lưu UserAvatar, thay bằng link ngắn trước khi ghi User */
  private async persistUploadedAvatar(userId: string, userData: Record<string, unknown>) {
    if (isAvatarDataUrl(userData.avatarUrl)) {
      userData.avatarUrl = await saveUserAvatar(this.prisma, userId, userData.avatarUrl);
    }
  }

  private requireReason(dto: TrainerReviewDto) {
    const reason = dto.reason?.trim() || null;
    if (!dto.approved && !reason)
      throw new BadRequestException("Vui lòng nhập lý do từ chối để PT biết cần chỉnh sửa gì.");
    return dto.approved ? null : reason;
  }

  private parseDraft(raw: string | null): ProfileDraft | null {
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ProfileDraft;
    } catch {
      return null;
    }
  }

  /** Chuẩn hoá input PT gửi lên về cùng dạng với currentProfile() để so sánh */
  private normalizeProfileInput(dto: UpdateMyTrainerProfileDto): ProfileDraft {
    const text = (v: unknown) => (typeof v === "string" ? v.trim() || null : null);
    const out: ProfileDraft = {};
    if (typeof dto.specialization === "string") out.specialization = dto.specialization.trim();
    if (dto.certification !== undefined) out.certification = text(dto.certification);
    if (dto.experienceYears !== undefined && dto.experienceYears !== null)
      out.experienceYears = Number(dto.experienceYears);
    if (dto.bio !== undefined) out.bio = text(dto.bio);
    if (dto.avatarUrl !== undefined) out.avatarUrl = text(dto.avatarUrl);
    if (dto.gender !== undefined) out.gender = dto.gender ?? null;
    if (dto.dateOfBirth !== undefined)
      out.dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth).toISOString().slice(0, 10)
        : null;
    if (dto.hourlyRate !== undefined)
      out.hourlyRate = dto.hourlyRate === null ? null : Number(dto.hourlyRate);
    return out;
  }

  private currentProfile(trainer: {
    specialization: string;
    certification: string | null;
    experienceYears: number;
    bio: string | null;
    gender: string | null;
    dateOfBirth: Date | null;
    hourlyRate: unknown;
    user: { avatarUrl: string | null };
  }): Required<ProfileDraft> {
    return {
      specialization: trainer.specialization,
      certification: trainer.certification,
      experienceYears: trainer.experienceYears,
      bio: trainer.bio,
      avatarUrl: trainer.user.avatarUrl,
      gender: trainer.gender,
      dateOfBirth: trainer.dateOfBirth ? trainer.dateOfBirth.toISOString().slice(0, 10) : null,
      hourlyRate: trainer.hourlyRate === null ? null : Number(trainer.hourlyRate),
    };
  }

  private toProfileData(draft: ProfileDraft) {
    const trainerData: Record<string, unknown> = {};
    const userData: Record<string, unknown> = {};
    for (const key of PROFILE_KEYS) {
      if (!(key in draft)) continue;
      const value = draft[key];
      if (key === "avatarUrl") userData.avatarUrl = value;
      else if (key === "dateOfBirth")
        trainerData.dateOfBirth = value ? new Date(value as string) : null;
      else trainerData[key] = value;
    }
    return { trainerData, userData };
  }

  /** Member đang đăng nhập xem HLV hiện tại của mình */
  async getMyTrainer(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member)
      throw new ForbiddenException(
        "Tài khoản này không gắn với hồ sơ hội viên.",
      );

    const assignment = await this.prisma.trainerMember.findFirst({
      where: { memberId: member.id, status: "ACTIVE" },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                avatarUrl: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      trainer: assignment?.trainer ?? null,
      assignment: assignment ?? null,
    };
  }
}
