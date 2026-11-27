import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CheckInMethod, PackageType } from "../../common/constants/db-enums";
import { Role } from "../../common/enums/role.enum";
import { PrismaService } from "../../prisma/prisma.service";
import { resolvePartnerIdForUser } from "../../common/utils/partner-scope";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { FacesService, type FaceMatchResult } from "../faces/faces.service";
import { FaceCheckInDto, FaceScanDto } from "./dto/checkin.dto";
import { parseJsonText } from "../../common/utils/json-text";
import { expireUsedUpCreditMemberships } from "../../common/utils/membership-usage";

const GYM_TIER_LABEL: Record<string, string> = {
  TIER_1: "Standard",
  TIER_2: "Plus",
  TIER_3: "Premium",
};

interface CheckInMember {
  id: string;
  status: string;
  fullName?: string;
}

@Injectable()
export class CheckinsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private facesService: FacesService,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Map user đang đăng nhập → hồ sơ Member (không tin memberId từ client) */
  private async resolveMemberByUserId(userId: string) {
    if (!userId)
      throw new ForbiddenException("Không xác định được tài khoản đăng nhập");
    const member = await this.prisma.member.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });
    if (!member) {
      throw new ForbiddenException(
        "Tài khoản này không gắn với hồ sơ hội viên.",
      );
    }
    return member;
  }

  /** Đóng các thẻ ACTIVE đã hết hạn (chạy nền, không phá dữ liệu) */
  private async syncExpiredMemberships(memberId: string) {
    await this.prisma.membership.updateMany({
      where: { memberId, status: "ACTIVE", endDate: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });
    // Gói lượt đã dùng hết lượt cũng kết thúc luôn
    await expireUsedUpCreditMemberships(this.prisma, memberId);
  }

  /** Lấy membership đang ACTIVE, còn hiệu lực trong ngày hôm nay (startDate <= now <= endDate) */
  private async getActiveMembership(memberId: string) {
    await this.syncExpiredMemberships(memberId);
    const now = new Date();
    return this.prisma.membership.findFirst({
      where: {
        memberId,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            type: true,
            visitLimit: true,
            dailyVisitLimit: true,
            gymTierAccess: true,
          },
        },
      },
      orderBy: { endDate: "desc" },
    });
  }

  /**
   * Kiểm tra toàn bộ điều kiện check-in (backend tự quyết, KHÔNG tin frontend):
   * 1) Member tồn tại   2) Account ACTIVE   3) Có membership   4) Membership ACTIVE
   * 5) startDate <= today <= endDate        6) Không có phiên CHECKED_IN đang mở
   * Trả về membership hợp lệ để response bổ sung thông tin.
   */
  private async validateMemberForCheckIn(member: CheckInMember) {
    // Điều kiện 2: tài khoản hội viên phải ACTIVE
    if (member.status !== "ACTIVE") {
      const message =
        member.status === "SUSPENDED"
          ? "Tài khoản của bạn đang bị tạm khóa."
          : `Tài khoản hội viên đang ở trạng thái ${member.status}.`;
      throw new BadRequestException(message);
    }

    const pendingRefund = await this.prisma.membershipChangeRequest.findFirst({
      where: {
        memberId: member.id,
        type: "CANCEL_REFUND",
        status: "PENDING_PAYOUT",
      },
      select: { id: true },
    });
    if (pendingRefund) {
      throw new BadRequestException(
        "Hợp đồng đang chờ hoàn tiền và không thể check-in cho đến khi xử lý xong",
      );
    }

    // Điều kiện 6 (kiểm tra trước): không được có attendance đang CHECKED_IN.
    // Đặt trước kiểm tra gói để hội viên vừa dùng lượt cuối vẫn nhận đúng thông báo
    // "đang trong phòng" (quét lần 2 = check-out) thay vì "gói đã hết hạn".
    const openSession = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: "CHECKED_IN" },
      select: { id: true },
    });
    if (openSession) {
      throw new BadRequestException("Bạn đang trong phòng gym.");
    }

    // Điều kiện 3 + 4 + 5: phải có membership ACTIVE còn hiệu lực hôm nay
    const now = new Date();
    const frozenMembership = await this.prisma.membership.findFirst({
      where: {
        memberId: member.id,
        status: "ACTIVE",
        startDate: { lte: now },
        endDate: { gte: now },
        freezeStartedAt: { lte: now },
        freezeEndsAt: { gte: now },
      },
      select: { id: true },
    });
    if (frozenMembership) {
      throw new BadRequestException(
        "Hợp đồng của bạn đang trong thời gian bảo lưu. Bạn có thể check-in sau khi thời gian này kết thúc.",
      );
    }

    const membership = await this.getActiveMembership(member.id);
    if (!membership) {
      const anyMembership = await this.prisma.membership.findFirst({
        where: { memberId: member.id },
        orderBy: { endDate: "desc" },
      });
      if (anyMembership) {
        throw new BadRequestException(
          "Gói tập của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục check-in.",
        );
      }
      throw new BadRequestException("Bạn chưa có gói tập đang hoạt động.");
    }

    return membership;
  }

  /** Validate and record quota usage atomically across all partner gyms. */
  private async createQuotaCheckedIn(
    memberId: string,
    membershipId: string,
    data: Prisma.CheckInUncheckedCreateInput,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const now =
          data.checkInTime instanceof Date
            ? data.checkInTime
            : data.checkInTime
              ? new Date(data.checkInTime)
              : new Date();
        const membership = await tx.membership.findFirst({
          where: {
            id: membershipId,
            memberId,
            status: "ACTIVE",
            startDate: { lte: now },
            endDate: { gte: now },
          },
          include: {
            package: {
              select: { type: true, visitLimit: true, dailyVisitLimit: true },
            },
          },
        });
        if (!membership) {
          throw new BadRequestException(
            "Gói tập không còn hiệu lực để check-in.",
          );
        }
        if (
          membership.freezeStartedAt &&
          membership.freezeStartedAt <= now &&
          membership.freezeEndsAt &&
          membership.freezeEndsAt >= now
        ) {
          throw new BadRequestException(
            "Gói tập đang trong thời gian bảo lưu.",
          );
        }

        const activeCheckIn = await tx.checkIn.findFirst({
          where: { memberId, status: "CHECKED_IN" },
          select: { id: true },
        });
        if (activeCheckIn) {
          throw new BadRequestException(
            "Hội viên đang có phiên tập chưa check-out.",
          );
        }

        // A business day is based on Vietnam time (UTC+7), across all partners.
        const vietnamNow = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const year = vietnamNow.getUTCFullYear();
        const month = vietnamNow.getUTCMonth();
        const day = vietnamNow.getUTCDate();
        const dayStart = new Date(
          Date.UTC(year, month, day) - 7 * 60 * 60 * 1000,
        );
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const monthStart = new Date(
          Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000,
        );
        const usageStart = new Date(
          Math.max(monthStart.getTime(), membership.startDate.getTime()),
        );

        const dailyLimit = Math.max(1, membership.package.dailyVisitLimit ?? 1);
        // Chỉ đếm lượt thuộc gói hiện tại: hội viên vừa dùng hết gói ngày rồi mua gói mới
        // trong cùng ngày thì vẫn được tập tiếp (lượt của gói cũ không tính vào gói mới).
        const todayVisits = await tx.checkIn.count({
          where: {
            memberId,
            checkInTime: {
              gte: new Date(Math.max(dayStart.getTime(), membership.startDate.getTime())),
              lt: dayEnd,
            },
          },
        });
        if (todayVisits >= dailyLimit) {
          throw new BadRequestException(
            `Gói tập chỉ cho phép tối đa ${dailyLimit} lượt check-in mỗi ngày.`,
          );
        }

        if (membership.package.type === PackageType.CREDIT_BASED) {
          const totalLimit = membership.package.visitLimit;
          if (totalLimit == null || totalLimit < 1) {
            throw new BadRequestException(
              "Gói lượt chưa được cấu hình tổng số lượt hợp lệ.",
            );
          }
          const usedVisits = await tx.checkIn.count({
            where: {
              memberId,
              checkInTime: { gte: membership.startDate, lt: now },
            },
          });
          if (usedVisits >= totalLimit) {
            throw new BadRequestException(
              "Gói tập đã sử dụng hết số lượt check-in.",
            );
          }
        } else if (
          membership.package.type === PackageType.FIXED_TERM &&
          membership.package.visitLimit != null &&
          membership.package.visitLimit > 0
        ) {
          const monthVisits = await tx.checkIn.count({
            where: {
              memberId,
              checkInTime: { gte: usageStart, lt: now },
            },
          });
          if (monthVisits >= membership.package.visitLimit) {
            throw new BadRequestException(
              `Gói tập đã đạt giới hạn ${membership.package.visitLimit} lượt trong tháng này.`,
            );
          }
        }

        return tx.checkIn.create({ data });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  /** Số lượt/tháng mặc định khi gói theo thời hạn chưa đặt giới hạn lượt */
  private static readonly VISITS_PER_MONTH = 12;

  private static memberSelect = {
    id: true,
    code: true,
    fullName: true,
    phone: true,
    avatarUrl: true,
  } satisfies Prisma.MemberSelect;

  private resolveCheckInMember<T extends { id: string }>(
    membersById: Map<string, T>,
    checkIn: { id: string; memberId: string },
  ): T {
    const member = membersById.get(checkIn.memberId.toLowerCase());
    if (!member) {
      throw new InternalServerErrorException(
        "Dữ liệu check-in đang tham chiếu đến hội viên không tồn tại.",
      );
    }
    return member;
  }

  /**
   * Đối tác chỉ được xem lượt tập của chính cơ sở mình.
   * Trả về id đối tác để thêm vào where; không có hồ sơ → chuỗi không khớp id nào
   * (KHÔNG được trả null vì `partnerId = null` sẽ làm lộ toàn bộ check-in hệ thống).
   */
  private async partnerFacilityId(
    role?: string,
    userId?: string,
  ): Promise<string | null> {
    if (role !== Role.PARTNER || !userId) return null;
    // Chủ đối tác hoặc nhân viên của đối tác đều xem dữ liệu cơ sở của đối tác đó
    return (await resolvePartnerIdForUser(this.prisma, userId)) ?? "__NO_FACILITY__";
  }

  /** Tên phòng gym đối tác nếu người thao tác là đối tác — để thông báo admin ghi rõ ai làm. */
  private async partnerActorName(actorId?: string): Promise<string | null> {
    const partnerId = await resolvePartnerIdForUser(this.prisma, actorId);
    if (!partnerId) return null;
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      select: { businessName: true },
    });
    return partner?.businessName ?? null;
  }

  private computeDurationMinutes(
    checkInTime: Date,
    checkOutTime?: Date | null,
  ): number | null {
    if (!checkOutTime) return null;
    return Math.max(
      1,
      Math.round((checkOutTime.getTime() - checkInTime.getTime()) / 60000),
    );
  }

  // ---------------------------------------------------------------------------
  // Member tự check-in / check-out
  // ---------------------------------------------------------------------------

  /** POST /checkins — member tự check-in (lấy member từ JWT) */
  async checkIn(userId: string, method?: CheckInMethod) {
    const member = await this.resolveMemberByUserId(userId);
    const membership = await this.validateMemberForCheckIn(member);

    const checkIn = await this.createQuotaCheckedIn(member.id, membership.id, {
      memberId: member.id,
      checkInTime: new Date(),
      status: "CHECKED_IN",
      method: method ?? CheckInMethod.MANUAL,
    });

    // Thông báo check-in thành công (STEP 8 + Realtime)
    await this.notificationsService.create({
      memberId: member.id,
      title: "Check-in thành công 💪",
      content: `Bạn đã check-in lúc ${checkIn.checkInTime.toLocaleTimeString("vi-VN")}.`,
      type: "CHECKIN",
      link: "/member/checkins",
      referenceType: "CHECKIN",
      referenceId: checkIn.id,
    });

    // Báo tổ quản trị / lễ tân chuông realtime
    await this.notificationsService.notifyAdmins(
      {
        type: "CHECKIN",
        title: "Hội viên check-in 💪",
        content: `${member.fullName} (${member.code}) vừa check-in lúc ${checkIn.checkInTime.toLocaleTimeString("vi-VN")} qua hình thức ${checkIn.method}.`,
        link: "/admin/checkins",
        referenceType: "CHECKIN",
        referenceId: checkIn.id,
      },
      userId,
    );

    await this.auditService.log({
      userId,
      action: "CHECK_IN",
      entity: "CheckIn",
      entityId: checkIn.id,
      metadata: { method: checkIn.method, memberCode: member.code },
    });

    return {
      success: true,
      message: "Check-in thành công",
      data: {
        id: checkIn.id,
        checkInAt: checkIn.checkInTime,
        status: checkIn.status,
        method: checkIn.method,
        member: {
          id: member.id,
          code: member.code,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
        },
        membership: membership
          ? { id: membership.id, packageName: membership.package?.name ?? null }
          : null,
      },
    };
  }

  /** POST /checkins/checkout — member tự check-out */
  async checkOut(userId: string) {
    const member = await this.resolveMemberByUserId(userId);

    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: "CHECKED_IN" },
    });
    if (!active) {
      throw new BadRequestException("Không tìm thấy phiên tập đang hoạt động.");
    }

    const checkOutAt = new Date();
    const updated = await this.prisma.checkIn.update({
      where: { id: active.id },
      data: { checkOutTime: checkOutAt, status: "CHECKED_OUT" },
    });

    // Thông báo check-out thành công (STEP 8 + Realtime)
    await this.notificationsService.create({
      memberId: member.id,
      title: "Check-out thành công 👋",
      content: `Buổi tập kết thúc lúc ${checkOutAt.toLocaleTimeString("vi-VN")}. Hẹn gặp lại bạn!`,
      type: "CHECKIN",
      link: "/member/checkins",
      referenceType: "CHECKOUT",
      referenceId: updated.id,
    });

    // Báo tổ quản trị / lễ tân chuông realtime
    await this.notificationsService.notifyAdmins(
      {
        type: "CHECKIN",
        title: "Hội viên check-out 👋",
        content: `${member.fullName} (${member.code}) đã kết thúc buổi tập lúc ${checkOutAt.toLocaleTimeString("vi-VN")}.`,
        link: "/admin/checkins",
        referenceType: "CHECKOUT",
        referenceId: updated.id,
      },
      userId,
    );

    await this.auditService.log({
      userId,
      action: "CHECK_OUT",
      entity: "CheckIn",
      entityId: updated.id,
      metadata: { memberCode: member.code },
    });

    return {
      success: true,
      message: "Check-out thành công",
      data: {
        id: updated.id,
        checkInAt: updated.checkInTime,
        checkOutAt,
        status: updated.status,
        durationMinutes: this.computeDurationMinutes(
          updated.checkInTime,
          checkOutAt,
        ),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Face check-in — quét nhận diện khuôn mặt (sinh trắc học)
  // ---------------------------------------------------------------------------

  /**
   * POST /checkins/face — hội viên tự quét khuôn mặt (1:1).
   * Bước 1: FacesService so vector với mẫu đã đăng ký của CHÍNH hội viên (cosine).
   * Bước 2: nếu khớp → gọi lại pipeline checkIn() chuẩn (validate thẻ tập,
   *          notification, audit) với method FACE_ID — không viết lại validate.
   */
  async faceCheckIn(userId: string, dto: FaceCheckInDto) {
    const member = await this.resolveMemberByUserId(userId);
    const match = await this.facesService.matchForMember(
      member.id,
      dto.embedding,
    );
    if (!match) {
      throw new BadRequestException(
        "Khuôn mặt không khớp với hồ sơ đăng ký. Vui lòng thử lại (đảm bảo đủ ánh sáng) hoặc đăng ký lại khuôn mặt.",
      );
    }

    const result = await this.checkIn(userId, CheckInMethod.FACE_ID);
    return {
      ...result,
      face: { similarity: Number(match.similarity.toFixed(4)) },
    };
  }

  /**
   * POST /checkins/face-scan — lễ tân quét 1:N tại quầy.
   * Server tự nhận diện (không tin memberId từ client) rồi chạy pipeline staffCheckIn.
   */
  /**
   * POST /checkins/face-checkout — lễ tân quét 1:N để check-out (tự tìm hội viên rồi đóng phiên đang mở)
   */
  async faceCheckOut(dto: FaceScanDto, role = "STAFF", actorId?: string) {
    const match = await this.facesService.matchGlobal(dto.embedding);
    if (!match) {
      throw new NotFoundException("Không nhận diện được hội viên nào.");
    }
    return this.checkOutFaceMatch(match, actorId);
  }

  /** Đóng phiên đang mở của hội viên vừa nhận diện bằng khuôn mặt (1:N) */
  private async checkOutFaceMatch(match: FaceMatchResult, actorId?: string) {
    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: match.memberId, status: "CHECKED_IN" },
    });
    if (!active) {
      throw new BadRequestException(
        "Hội viên chưa check-in (không có phiên tập đang mở).",
      );
    }
    const updated = await this.prisma.checkIn.update({
      where: { id: active.id },
      data: { checkOutTime: new Date(), status: "CHECKED_OUT" },
    });
    await this.notificationsService.create({
      memberId: active.memberId,
      title: "Check-out thành công 👋",
      content: `Bạn đã kết thúc buổi tập lúc ${updated.checkOutTime!.toLocaleTimeString("vi-VN")}.`,
      type: "CHECKIN",
      link: "/member/checkins",
      referenceType: "CHECKOUT",
      referenceId: updated.id,
    });
    const partnerName = await this.partnerActorName(actorId);
    await this.notificationsService.notifyAdmins(
      {
        type: "CHECKIN",
        title: partnerName
          ? "Đối tác check-out hội viên (Face ID) 👋"
          : "Hội viên check-out (Face ID) 👋",
        content: `${partnerName ? `${partnerName}: ` : ""}Hội viên ${match.memberCode ?? "hội viên"} vừa quét mặt check-out lúc ${updated.checkOutTime!.toLocaleTimeString("vi-VN")}.`,
        link: "/admin/checkins",
        referenceType: "CHECKOUT",
        referenceId: updated.id,
      },
      actorId,
    );
    await this.auditService.log({
      userId: actorId,
      action: "CHECK_OUT",
      entity: "CheckIn",
      entityId: updated.id,
      metadata: {
        method: CheckInMethod.FACE_ID,
        memberCode: match.memberCode ?? "",
        via: "staff-face-checkout",
      },
    });
    return {
      success: true,
      message: "Check-out thành công",
      data: {
        id: updated.id,
        checkInTime: updated.checkInTime,
        checkOutTime: updated.checkOutTime,
        status: updated.status,
        member: {
          id: active.memberId,
          code:
            match.memberCode ??
            (
              await this.prisma.member.findUnique({
                where: { id: match.memberId },
                select: { code: true },
              })
            )?.code ??
            "",
          fullName:
            (
              await this.prisma.member.findUnique({
                where: { id: match.memberId },
                select: { fullName: true },
              })
            )?.fullName ?? "",
        },
      },
      action: "CHECK_OUT" as const,
      face: {
        similarity: Number(match.similarity.toFixed(4)),
        imageData: match.imageData,
      },
    };
  }

  async faceScanForStaff(dto: FaceScanDto, role: string, actorId?: string) {
    const match = await this.facesService.matchGlobal(dto.embedding);
    if (!match) {
      throw new NotFoundException(
        "Không nhận diện được hội viên nào. Vui lòng thử lại hoặc check-in thủ công.",
      );
    }

    // Quét lần 2 khi hội viên còn đang trong phòng = check-out
    const open = await this.prisma.checkIn.findFirst({
      where: { memberId: match.memberId, status: "CHECKED_IN" },
      select: { id: true },
    });
    if (open) return this.checkOutFaceMatch(match, actorId);

    const result = await this.staffCheckIn(
      {
        memberId: match.memberId,
        method: CheckInMethod.FACE_ID,
        note: `Quét khuôn mặt — độ khớp ${(match.similarity * 100).toFixed(1)}%`,
      },
      role,
      actorId,
    );
    return {
      ...result,
      action: "CHECK_IN" as const,
      face: {
        similarity: Number(match.similarity.toFixed(4)),
        imageData: match.imageData,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Member: trạng thái hiện tại & lịch sử
  // ---------------------------------------------------------------------------

  /** GET /checkins/me/current — member đang trong phòng hay không */
  async getCurrent(userId: string) {
    const member = await this.resolveMemberByUserId(userId);
    const active = await this.prisma.checkIn.findFirst({
      where: { memberId: member.id, status: "CHECKED_IN" },
    });
    if (!active) {
      return { checkedIn: false };
    }
    return {
      checkedIn: true,
      checkInAt: active.checkInTime,
      sinceMinutes: this.computeDurationMinutes(active.checkInTime, new Date()),
      checkInId: active.id,
    };
  }

  /** GET /checkins/me/history — lịch sử cá nhân + statistics */
  async getMyHistory(userId: string, query: MyHistoryQuery = {}) {
    const member = await this.resolveMemberByUserId(userId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = { memberId: member.id };

    if (query.month) {
      const [y, m] = query.month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      where.checkInTime = { gte: start, lt: end };
    } else if (query.fromDate || query.toDate) {
      const from = query.fromDate
        ? this.startOfDay(new Date(query.fromDate))
        : undefined;
      const to = query.toDate
        ? this.endOfDay(new Date(query.toDate))
        : undefined;
      where.checkInTime = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        orderBy: { checkInTime: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    // Statistics: tổng / tháng / tuần / thời gian tập trung bình
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    const day = (startOfWeek.getDay() + 6) % 7; // Thứ 2 = 0
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const [month, week] = await Promise.all([
      this.prisma.checkIn.count({
        where: { memberId: member.id, checkInTime: { gte: startOfMonth } },
      }),
      this.prisma.checkIn.count({
        where: { memberId: member.id, checkInTime: { gte: startOfWeek } },
      }),
    ]);

    // Average duration (chỉ tính các phiên đã check-out)
    const doneRows = await this.prisma.checkIn.findMany({
      where: { memberId: member.id, checkOutTime: { not: null } },
      select: { checkInTime: true, checkOutTime: true },
    });
    let avgDuration = 0;
    if (doneRows.length > 0) {
      const totalMinutes = doneRows.reduce(
        (sum, r) =>
          sum +
          Math.max(
            1,
            Math.round(
              (r.checkOutTime!.getTime() - r.checkInTime.getTime()) / 60000,
            ),
          ),
        0,
      );
      avgDuration = Math.round(totalMinutes / doneRows.length);
    }

    return {
      data: await Promise.all(data.map((c) => this.toHistoryRow(c))),
      total,
      page,
      limit,
      stats: { total, month, week, avgDuration },
    };
  }

  private async toHistoryRow(c: any) {
    return {
      id: c.id,
      checkInTime: c.checkInTime,
      checkOutTime: c.checkOutTime,
      status: c.status,
      method: c.method,
      durationMinutes: this.computeDurationMinutes(
        c.checkInTime,
        c.checkOutTime,
      ),
    };
  }

  // ---------------------------------------------------------------------------
  // Staff / Admin thao tác cho người khác
  // ---------------------------------------------------------------------------

  /** POST /checkins/staff — lễ tân check-in hội viên theo memberId (không tin member) */
  async staffCheckIn(dto: StaffCheckInInput, role = "STAFF", actorId?: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
    });
    if (!member) throw new NotFoundException("Không tìm thấy hội viên.");

    const membership = await this.validateMemberForCheckIn(member);

    // Người thao tác là đối tác → ghi nhận lượt tập tại phòng gym của họ và chốt hoa hồng.
    // Admin/staff check-in cho hệ thống chung thì không gắn đối tác.
    const actorPartnerId = await resolvePartnerIdForUser(this.prisma, actorId);
    const partner = actorPartnerId
      ? await this.prisma.partner.findUnique({
          where: { id: actorPartnerId },
          select: {
            id: true,
            status: true,
            commissionRate: true,
            businessName: true,
            gymTier: true,
            partnershipType: true,
          },
        })
      : null;
    const attributed = partner?.status === "APPROVED";

    // Hội viên riêng của một phòng gym đối tác chỉ check-in được tại chính phòng đó.
    const ownMember = Boolean(member.ownerPartnerId) && member.ownerPartnerId === partner?.id;
    if (member.ownerPartnerId && !(attributed && ownMember)) {
      throw new BadRequestException(
        "Hội viên này thuộc một phòng gym đối tác khác — chỉ check-in được tại phòng đã đăng ký.",
      );
    }

    // Hội viên Gym Master (gói nền tảng) chỉ được tập tại phòng thuộc mạng lưới Gym Cộng đồng.
    // Phòng tự quản lý (OWNER) chỉ phục vụ hội viên riêng nên không nhận lượt tập & hoa hồng.
    if (attributed && !ownMember) {
      if (partner!.partnershipType !== "COMMUNITY") {
        throw new BadRequestException(
          "Hội viên này dùng gói Gym Master — phòng tập của bạn chưa tham gia mạng lưới Gym Cộng đồng nên không check-in được.",
        );
      }
      if (!partner!.gymTier) {
        throw new BadRequestException(
          "Phòng tập chưa được Gym Master xếp hạng nên chưa nhận hội viên gói Gym Master. Vui lòng liên hệ quản trị viên.",
        );
      }
    }

    // Phòng Gym Cộng đồng → gói (của hệ thống) phải bao gồm hạng phòng này.
    // Hội viên riêng của phòng dùng gói riêng nên không xét hạng.
    if (attributed && !ownMember && partner!.gymTier) {
      const allowed = parseJsonText<string[]>(membership.package?.gymTierAccess) ?? [];
      if (!allowed.includes(partner!.gymTier)) {
        const label = GYM_TIER_LABEL[partner!.gymTier] ?? partner!.gymTier;
        throw new BadRequestException(
          `Gói "${membership.package?.name ?? "hiện tại"}" của hội viên không bao gồm phòng gym hạng ${label}. Hội viên cần nâng cấp gói để tập tại đây.`,
        );
      }
    }
    // Hội viên riêng của phòng: ghi nhận lượt tập tại phòng nhưng KHÔNG tính hoa hồng
    // (doanh thu gói đã thuộc về đối tác).
    const rate = attributed && !ownMember ? Number(partner!.commissionRate) : 0;
    const total =
      attributed && membership
        ? Number(membership.finalAmount ?? membership.price ?? 0)
        : 0;
    // Hoa hồng = (tiền gói của hội viên / tổng số lượt của gói) × tỷ lệ của đối tác.
    // Chỉ dựa vào gói hội viên đã mua, không phụ thuộc hạng phòng.
    // - Gói lượt (CREDIT_BASED): tổng lượt = số lượt của gói (vd 6.000.000đ / 30 lượt).
    // - Gói theo thời hạn: tổng lượt = giới hạn lượt/tháng × số tháng
    //   (vd Plus 12 tháng 9.200.000đ / (20 × 12) lượt). Gói chưa đặt giới hạn → 12 lượt/tháng.
    const pkgVisitLimit = membership?.package?.visitLimit ?? 0;
    const termDays = membership
      ? Math.max(
          1,
          Math.ceil(
            (membership.endDate.getTime() - membership.startDate.getTime()) / 86400000,
          ),
        )
      : 1;
    const months = Math.max(1, Math.round(termDays / 30));
    const totalVisits =
      membership?.package?.type === PackageType.CREDIT_BASED && pkgVisitLimit > 0
        ? pkgVisitLimit
        : (pkgVisitLimit > 0 ? pkgVisitLimit : CheckinsService.VISITS_PER_MONTH) * months;
    const unitPrice =
      attributed && !ownMember && membership
        ? Math.round((total / totalVisits) * 100) / 100
        : null;
    const commissionAmount =
      unitPrice !== null ? Math.round(unitPrice * rate * 100) / 100 : null;

    const checkIn = await this.createQuotaCheckedIn(member.id, membership.id, {
      memberId: member.id,
      checkInTime: new Date(),
      status: "CHECKED_IN",
      method: dto.method ?? CheckInMethod.STAFF,
      notes: dto.note ?? null,
      partnerId: attributed ? partner!.id : null,
      unitPrice,
      commissionRate: attributed && !ownMember ? partner!.commissionRate : null,
      commissionAmount,
    });

    // Thông báo check-in bởi lễ tân (STEP 8 + Realtime)
    await this.notificationsService.create({
      memberId: member.id,
      title: "Check-in thành công 💪",
      content: `Lễ tân đã check-in cho bạn lúc ${checkIn.checkInTime.toLocaleTimeString("vi-VN")}.`,
      type: "CHECKIN",
      link: "/member/checkins",
      referenceType: "CHECKIN_STAFF",
      referenceId: checkIn.id,
    });

    await this.notificationsService.notifyAdmins(
      {
        type: "CHECKIN",
        title: attributed ? "Đối tác check-in hội viên 💪" : "Check-in tại quầy 💪",
        content: `${attributed ? `${partner!.businessName}: ` : ""}Đã check-in cho ${member.fullName} (${member.code}) lúc ${checkIn.checkInTime.toLocaleTimeString("vi-VN")}.`,
        link: "/admin/checkins",
        referenceType: "CHECKIN",
        referenceId: checkIn.id,
      },
      actorId,
    );

    await this.auditService.log({
      userId: actorId,
      action: "CHECK_IN",
      entity: "CheckIn",
      entityId: checkIn.id,
      metadata: {
        method: checkIn.method,
        memberCode: member.code,
        via: attributed ? "partner" : "staff",
        partnerId: checkIn.partnerId,
        commissionAmount: commissionAmount ?? undefined,
      },
    });

    return {
      success: true,
      message: "Check-in thành công",
      data: {
        id: checkIn.id,
        checkInAt: checkIn.checkInTime,
        status: checkIn.status,
        method: checkIn.method,
        member: {
          id: member.id,
          code: member.code,
          fullName: member.fullName,
          avatarUrl: member.avatarUrl,
        },
        membership: membership
          ? { id: membership.id, packageName: membership.package?.name ?? null }
          : null,
        commission: attributed
          ? {
              unitPrice,
              rate,
              amount: commissionAmount,
              partnerId: partner!.id,
            }
          : null,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin / Staff: danh sách & hiện đang trong phòng
  // ---------------------------------------------------------------------------

  /** POST /checkins/:id/checkout — admin/staff check-out giúp member */
  async checkoutById(id: string, actorId?: string) {
    const record = await this.prisma.checkIn.findUnique({ where: { id } });
    if (!record) throw new NotFoundException("Không tìm thấy phiên check-in.");

    if (record.status === "CHECKED_OUT") {
      throw new BadRequestException(
        "Phiên tập này đã kết thúc (đã check-out).",
      );
    }

    const checkOutAt = new Date();
    const updated = await this.prisma.checkIn.update({
      where: { id },
      data: { checkOutTime: checkOutAt, status: "CHECKED_OUT" },
      include: {
        member: { select: CheckinsService.memberSelect },
      },
    });

    if (updated.memberId) {
      await this.notificationsService.create({
        memberId: updated.memberId,
        title: "Check-out thành công 👋",
        content: `Lễ tân đã kết thúc buổi tập giúp bạn lúc ${checkOutAt.toLocaleTimeString("vi-VN")}. Hẹn gặp lại bạn!`,
        type: "CHECKIN",
        link: "/member/checkins",
        referenceType: "CHECKOUT",
        referenceId: updated.id,
      });

      const partnerName = await this.partnerActorName(actorId);
      await this.notificationsService.notifyAdmins(
        {
          type: "CHECKIN",
          title: partnerName ? "Đối tác check-out hội viên 👋" : "Check-out tại quầy 👋",
          content: `${partnerName ? `${partnerName}: ` : ""}Đã check-out cho ${updated.member?.fullName || "hội viên"} (${updated.member?.code || ""}) lúc ${checkOutAt.toLocaleTimeString("vi-VN")}.`,
          link: "/admin/checkins",
          referenceType: "CHECKOUT",
          referenceId: updated.id,
        },
        actorId,
      );
    }

    await this.auditService.log({
      userId: actorId,
      action: "CHECK_OUT",
      entity: "CheckIn",
      entityId: updated.id,
      metadata: { memberCode: updated.member?.code ?? null, via: "staff" },
    });

    return {
      success: true,
      message: "Check-out thành công",
      data: {
        id: updated.id,
        member: updated.member,
        checkInAt: updated.checkInTime,
        checkOutAt,
        status: updated.status,
        durationMinutes: this.computeDurationMinutes(
          updated.checkInTime,
          checkOutAt,
        ),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Admin / Staff: danh sách & hiện đang trong phòng
  // ---------------------------------------------------------------------------

  /** GET /checkins — lịch sử toàn hệ thống (search / filter / sort / pagination) */
  async findAll(
    query: GetCheckinsQuery = {},
    actorRole?: string,
    actorId?: string,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Number(query.limit) || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.CheckInWhereInput = {};

    // Đối tác: chỉ lịch sử check-in của chính cơ sở mình
    const facilityId = await this.partnerFacilityId(actorRole, actorId);
    if (facilityId) where.partnerId = facilityId;

    if (query.status) where.status = query.status as any;

    if (query.search) {
      const term = query.search.trim();
      if (term) {
        const matchingMembers = await this.prisma.member.findMany({
          where: {
            OR: [
              { fullName: { contains: term } },
              { code: { contains: term } },
              { phone: { contains: term } },
            ],
          },
          select: { id: true },
        });
        where.memberId = { in: matchingMembers.map((member) => member.id) };
      }
    }

    if (query.fromDate || query.toDate) {
      const from = query.fromDate
        ? this.startOfDay(new Date(query.fromDate))
        : undefined;
      const to = query.toDate
        ? this.endOfDay(new Date(query.toDate))
        : undefined;
      where.checkInTime = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    const sortBy = ["checkInTime", "checkOutTime", "createdAt"].includes(
      query.sortBy!,
    )
      ? query.sortBy!
      : "checkInTime";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    const memberIds = [...new Set(data.map((checkIn) => checkIn.memberId))];
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: CheckinsService.memberSelect,
    });
    const membersById = new Map(
      members.map((member) => [member.id.toLowerCase(), member]),
    );

    return {
      data: data.map((c) => ({
        id: c.id,
        memberId: c.memberId,
        checkInTime: c.checkInTime,
        checkOutTime: c.checkOutTime,
        status: c.status,
        method: c.method,
        notes: c.notes,
        durationMinutes: this.computeDurationMinutes(
          c.checkInTime,
          c.checkOutTime,
        ),
        member: this.resolveCheckInMember(membersById, c),
      })),
      total,
      page,
      limit,
    };
  }

  /** GET /checkins/currently-inside — danh sách hội viên đang có mặt trong phòng */
  async currentlyInside(actorRole?: string, actorId?: string) {
    const facilityId = await this.partnerFacilityId(actorRole, actorId);
    const rows = await this.prisma.checkIn.findMany({
      where: {
        status: "CHECKED_IN",
        ...(facilityId ? { partnerId: facilityId } : {}),
      },
      orderBy: { checkInTime: "asc" },
    });
    const memberIds = [...new Set(rows.map((checkIn) => checkIn.memberId))];
    const members = await this.prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: {
        ...CheckinsService.memberSelect,
        memberships: {
          where: { status: "ACTIVE" },
          include: { package: { select: { id: true, name: true } } },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });
    const membersById = new Map(
      members.map((member) => [member.id.toLowerCase(), member]),
    );

    const now = new Date();
    return rows.map((c) => {
      const member = this.resolveCheckInMember(membersById, c);
      return {
        id: c.id,
        memberId: c.memberId,
        member,
        packageName: member.memberships[0]?.package?.name ?? null,
        checkInTime: c.checkInTime,
        durationMinutes: this.computeDurationMinutes(c.checkInTime, now),
        method: c.method,
      };
    });
  }

  /**
   * GET /checkins/facility-members — tìm hội viên đang đủ điều kiện tập để đối
   * tác check-in thủ công. Gói hội viên không gắn với một cơ sở cụ thể, vì vậy
   * lọc theo hợp đồng còn hiệu lực; lịch sử lượt đến vẫn được tính riêng theo cơ sở.
   */
  async facilityMembers(
    search: string,
    actorId: string,
    pageInput?: number | string,
    limitInput?: number | string,
  ) {
    const facilityId =
      (await this.partnerFacilityId(Role.PARTNER, actorId)) ??
      "__NO_FACILITY__";
    const term = (search ?? "").trim();
    const page = Math.max(1, Number(pageInput) || 1);
    const limit = Math.min(100, Math.max(1, Number(limitInput) || 20));
    const now = new Date();
    const where: Prisma.MemberWhereInput = {
      status: "ACTIVE",
      // Chỉ hội viên cộng đồng (tài khoản hệ thống Gym Master). Hội viên riêng do
      // đối tác tự tạo (ownerPartnerId != null) nằm ở trang Hội viên của đối tác.
      ownerPartnerId: null,
      memberships: {
        some: {
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
          OR: [
            { freezeStartedAt: null },
            { freezeEndsAt: null },
            { freezeStartedAt: { gt: now } },
            { freezeEndsAt: { lt: now } },
          ],
        },
      },
      checkIns: { none: { status: "CHECKED_IN" } },
      ...(term
        ? {
            OR: [
              { fullName: { contains: term } },
              { code: { contains: term } },
              { phone: { contains: term } },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        select: {
          ...CheckinsService.memberSelect,
          checkIns: {
            where: { partnerId: facilityId },
            select: { checkInTime: true },
            orderBy: { checkInTime: "desc" },
            take: 1,
          },
          _count: {
            select: { checkIns: { where: { partnerId: facilityId } } },
          },
        },
        orderBy: { fullName: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: members.map(({ checkIns, _count, ...member }) => ({
        ...member,
        visitCount: _count.checkIns,
        lastVisit: checkIns[0]?.checkInTime ?? null,
      })),
      total,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers thời gian
  // ---------------------------------------------------------------------------

  private startOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private endOfDay(d: Date): Date {
    const copy = new Date(d);
    copy.setHours(23, 59, 59, 999);
    return copy;
  }
}

// ---------------------------------------------------------------------------
// Types (không muốn tạo file types riêng để giữ module gọn)
// ---------------------------------------------------------------------------

export interface MyHistoryQuery {
  page?: number | string;
  limit?: number | string;
  month?: string;
  fromDate?: string;
  toDate?: string;
}

export interface GetCheckinsQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface StaffCheckInInput {
  memberId: string;
  method?: CheckInMethod;
  note?: string;
}
