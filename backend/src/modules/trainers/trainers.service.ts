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
import {
  CreateTrainerDto,
  TrainerQueryDto,
  UpdateMyTrainerProfileDto,
  UpdateTrainerDto,
} from "./dto/trainer.dto";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";

/** Mật khẩu mặc định cho tài khoản HLV mới do admin tạo (trả về 1 lần khi tạo) */
export const DEFAULT_TRAINER_PASSWORD = "Trainer@123456";

@Injectable()
export class TrainersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
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

  async findAll(query: TrainerQueryDto = {}) {
    const { page = 1, limit = 20, search, status, specialization } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
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

  async findOne(id: string) {
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

  async create(dto: CreateTrainerDto, actorId?: string) {
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
          status:
            dto.status === TrainerStatus.INACTIVE
              ? UserStatus.INACTIVE
              : UserStatus.ACTIVE,
          avatarUrl: dto.avatarUrl ?? null,
        },
      });

      const trainer = await tx.trainer.create({
        data: {
          userId: user.id,
          specialization: dto.specialization,
          certification: dto.certification ?? null,
          experienceYears: dto.experienceYears ?? 1,
          bio: dto.bio ?? null,
          gender: dto.gender ?? null,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          hourlyRate: dto.hourlyRate ?? null,
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

  async update(id: string, dto: UpdateTrainerDto, actorId?: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");

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
  async remove(id: string, actorId?: string) {
    const trainer = await this.prisma.trainer.findUnique({ where: { id } });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");

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

  async getMembers(trainerId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
    });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");

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

  async assignMember(trainerId: string, memberId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      include: { user: { select: { fullName: true } } },
    });
    if (!trainer)
      throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    if (trainer.status !== TrainerStatus.ACTIVE) {
      throw new BadRequestException(
        "Huấn luyện viên đang không hoạt động, không thể gán hội viên mới.",
      );
    }

    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException("Không tìm thấy hội viên.");
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

  async unassignMember(trainerId: string, memberId: string) {
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
      stats: {
        totalSessions,
        activeMembers,
        upcomingSessions,
        completedSessions,
      },
    };
  }

  /** HLV tự chỉnh hồ sơ công khai + giá kèm riêng theo buổi */
  async updateMyProfile(userId: string, dto: UpdateMyTrainerProfileDto) {
    const trainer = await this.resolveTrainerByUserId(userId);

    const trainerData: any = {};
    if (dto.specialization !== undefined)
      trainerData.specialization = dto.specialization;
    if (dto.certification !== undefined)
      trainerData.certification = dto.certification.trim() || null;
    if (dto.experienceYears !== undefined)
      trainerData.experienceYears = dto.experienceYears;
    if (dto.bio !== undefined) trainerData.bio = dto.bio.trim() || null;
    if (dto.gender !== undefined) trainerData.gender = dto.gender;
    if (dto.dateOfBirth !== undefined)
      trainerData.dateOfBirth = dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : null;
    if (dto.hourlyRate !== undefined) trainerData.hourlyRate = dto.hourlyRate;

    const userData: any = {};
    if (dto.avatarUrl !== undefined)
      userData.avatarUrl = dto.avatarUrl.trim() || null;

    const [, updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: trainer.userId }, data: userData }),
      this.prisma.trainer.update({
        where: { id: trainer.id },
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
      userId,
      action: "TRAINER_UPDATE",
      entity: "Trainer",
      entityId: trainer.id,
      metadata: {
        fields: Object.keys({ ...trainerData, ...userData }),
        source: "SELF",
      },
    });

    return {
      message: "Đã cập nhật hồ sơ huấn luyện viên.",
      trainer: updated,
    };
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
