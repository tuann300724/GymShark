import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  MembershipChangeStatus,
  MembershipChangeType,
  PaymentStatus,
} from "../../common/constants/db-enums";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ApproveMembershipChangeDto } from "./dto/approve-membership-change.dto";
import { CreateMembershipChangeDto } from "./dto/create-membership-change.dto";
import { ProposeMembershipRefundDto } from "./dto/propose-membership-refund.dto";
import { ReconcileMembershipPtDto } from "./dto/reconcile-membership-pt.dto";
import { RecordMembershipRefundDto } from "./dto/record-membership-refund.dto";
import { RejectMembershipChangeDto } from "./dto/reject-membership-change.dto";

const ACTIVE_REQUEST_STATUSES = [
  MembershipChangeStatus.REQUESTED,
  MembershipChangeStatus.AWAITING_MEMBER_CONFIRMATION,
  MembershipChangeStatus.PENDING_MANAGER_APPROVAL,
  MembershipChangeStatus.PENDING_PAYOUT,
];
const REJECTABLE_REQUEST_STATUSES = ACTIVE_REQUEST_STATUSES.filter(
  (status) => status !== MembershipChangeStatus.PENDING_PAYOUT,
);
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MembershipChangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findMine(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member)
      throw new ForbiddenException("Tài khoản không gắn với hồ sơ hội viên");

    const requests = await this.prisma.membershipChangeRequest.findMany({
      where: {
        memberId: member.id,
      },
      include: this.requestInclude(),
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return requests.map((request) => ({
      ...request,
      isRequester: request.memberId === member.id,
    }));
  }

  async findAll() {
    return this.prisma.membershipChangeRequest.findMany({
      where: { status: { in: ACTIVE_REQUEST_STATUSES } },
      include: this.requestInclude(),
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }

  async getPtReconciliation(id: string) {
    const request = await this.getRequest(id);
    this.assertPtReconciliationRequest(request);

    const membership = await this.prisma.membership.findUnique({
      where: { id: request.membershipId },
      select: {
        id: true,
        memberId: true,
        startDate: true,
        endDate: true,
        ptSessionsIncluded: true,
        ptSessionsUsed: true,
        ptSessionValue: true,
        package: {
          select: { sessions: true, ptSessionValue: true },
        },
      },
    });
    if (!membership) throw new NotFoundException("Không tìm thấy hợp đồng");

    const sessionFilter: Prisma.TrainingScheduleWhereInput = {
      type: "PERSONAL_TRAINING",
      status: "COMPLETED",
      OR: [
        { membershipId: membership.id },
        {
          membershipId: null,
          memberId: membership.memberId,
          startTime: {
            gte: membership.startDate,
            lte: membership.endDate,
          },
        },
      ],
    };
    const [sessions, linkedCompletedCount] = await Promise.all([
      this.prisma.trainingSchedule.findMany({
        where: sessionFilter,
        select: {
          id: true,
          title: true,
          startTime: true,
          completedAt: true,
          membershipId: true,
        },
        orderBy: { startTime: "asc" },
        take: 1000,
      }),
      this.prisma.trainingSchedule.count({
        where: {
          membershipId: membership.id,
          type: "PERSONAL_TRAINING",
          status: "COMPLETED",
        },
      }),
    ]);

    return {
      packageSessions: membership.package.sessions,
      packagePtSessionValue: membership.package.ptSessionValue,
      includedSessions: membership.ptSessionsIncluded,
      usedSessions: membership.ptSessionsUsed,
      sessionValue: membership.ptSessionValue,
      linkedCompletedCount,
      unlinkedCompletedSessions: sessions
        .filter((session) => session.membershipId === null)
        .map((session) => ({
          id: session.id,
          title: session.title,
          startTime: session.startTime,
          completedAt: session.completedAt,
        })),
    };
  }

  async reconcilePt(
    id: string,
    actorId: string,
    dto: ReconcileMembershipPtDto,
  ) {
    const request = await this.getRequest(id);
    this.assertPtReconciliationRequest(request);
    if (dto.usedSessions > dto.includedSessions) {
      throw new BadRequestException(
        "Số buổi đã dùng không thể lớn hơn quota PT của hợp đồng",
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id FROM dbo.MembershipChangeRequest WITH (UPDLOCK, HOLDLOCK)
        WHERE id = ${id}
      `);
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id FROM dbo.Membership WITH (UPDLOCK, HOLDLOCK)
        WHERE id = ${request.membershipId}
      `);

      const currentRequest = await tx.membershipChangeRequest.findUnique({
        where: { id },
        select: { type: true, status: true },
      });
      if (
        !currentRequest ||
        currentRequest.type !== MembershipChangeType.CANCEL_REFUND ||
        currentRequest.status !== MembershipChangeStatus.REQUESTED
      ) {
        throw new ConflictException(
          "Chỉ có thể đối soát PT khi yêu cầu đang chờ đề xuất hoàn tiền",
        );
      }

      const membership = await tx.membership.findUnique({
        where: { id: request.membershipId },
        select: {
          id: true,
          memberId: true,
          startDate: true,
          endDate: true,
          ptSessionsIncluded: true,
          ptSessionsUsed: true,
          ptSessionValue: true,
          package: { select: { sessions: true, ptSessionValue: true } },
        },
      });
      if (!membership) throw new NotFoundException("Không tìm thấy hợp đồng");

      const linkedCompletedCount = await tx.trainingSchedule.count({
        where: {
          membershipId: membership.id,
          type: "PERSONAL_TRAINING",
          status: "COMPLETED",
        },
      });
      if (dto.usedSessions < linkedCompletedCount) {
        throw new BadRequestException(
          `Đã có ${linkedCompletedCount} buổi PT hoàn thành liên kết trực tiếp với hợp đồng; số đã dùng không thể thấp hơn mức này`,
        );
      }

      const updatedMembership = await tx.membership.update({
        where: { id: membership.id },
        data: {
          ptSessionsIncluded: dto.includedSessions,
          ptSessionsUsed: dto.usedSessions,
          ptSessionValue: new Prisma.Decimal(dto.sessionValue.toFixed(2)),
        },
        select: {
          id: true,
          ptSessionsIncluded: true,
          ptSessionsUsed: true,
          ptSessionValue: true,
        },
      });
      return {
        membership: updatedMembership,
        linkedCompletedCount,
        remainingSessions: dto.includedSessions - dto.usedSessions,
        previous: {
          includedSessions: membership.ptSessionsIncluded,
          usedSessions: membership.ptSessionsUsed,
          sessionValue: membership.ptSessionValue,
        },
      };
    });

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_PT_QUOTA_RECONCILED",
      entity: "Membership",
      entityId: request.membershipId,
      metadata: {
        requestId: id,
        includedSessions: result.membership.ptSessionsIncluded,
        usedSessions: result.membership.ptSessionsUsed,
        remainingSessions: result.remainingSessions,
        sessionValue: Number(result.membership.ptSessionValue),
        linkedCompletedCount: result.linkedCompletedCount,
        note: dto.note.trim(),
        previous: result.previous,
      },
    });

    return {
      message: "Đã lưu kết quả đối soát quota PT",
      ...result,
    };
  }

  async create(
    userId: string,
    membershipId: string,
    dto: CreateMembershipChangeDto,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true, fullName: true },
    });
    if (!member)
      throw new ForbiddenException("Tài khoản không gắn với hồ sơ hội viên");

    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: { package: { select: { name: true } } },
    });
    if (!membership || membership.memberId !== member.id) {
      throw new NotFoundException("Không tìm thấy hợp đồng của bạn");
    }
    if (membership.status !== "ACTIVE" || membership.endDate < new Date()) {
      throw new ConflictException(
        "Chỉ có thể yêu cầu thay đổi hợp đồng đang còn hiệu lực",
      );
    }
    if (
      membership.freezeStartedAt &&
      (!membership.freezeEndsAt || membership.freezeEndsAt >= new Date())
    ) {
      throw new ConflictException("Hợp đồng đang trong thời gian bảo lưu");
    }

    const type = dto.type;
    if (type === MembershipChangeType.FREEZE) {
      if (!dto.freezeDays || dto.freezeDays < 1 || dto.freezeDays > 30) {
        throw new BadRequestException(
          "Thời gian bảo lưu phải từ 1 đến 30 ngày",
        );
      }
      if (membership.freezeStartedAt) {
        throw new ConflictException(
          "Hợp đồng này đã sử dụng quyền bảo lưu một lần",
        );
      }
    }

    const status =
      type === MembershipChangeType.CANCEL_REFUND
        ? MembershipChangeStatus.REQUESTED
        : MembershipChangeStatus.PENDING_MANAGER_APPROVAL;
    const request = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT id
        FROM dbo.Membership WITH (UPDLOCK, HOLDLOCK)
        WHERE id = ${membershipId}
      `);
      const currentNow = new Date();
      const currentMembership = await tx.membership.findFirst({
        where: {
          id: membershipId,
          memberId: member.id,
          status: "ACTIVE",
          endDate: { gte: new Date() },
        },
        select: { freezeStartedAt: true, freezeEndsAt: true },
      });
      if (!currentMembership) {
        throw new ConflictException("Hợp đồng không còn hoạt động để thay đổi");
      }
      if (
        currentMembership.freezeStartedAt &&
        (!currentMembership.freezeEndsAt ||
          currentMembership.freezeEndsAt >= currentNow)
      ) {
        throw new ConflictException("Hợp đồng đang trong thời gian bảo lưu");
      }
      const existingRequest = await tx.membershipChangeRequest.findFirst({
        where: {
          membershipId,
          status: { in: ACTIVE_REQUEST_STATUSES },
        },
        select: { id: true },
      });
      if (existingRequest) {
        throw new ConflictException(
          "Hợp đồng đang có yêu cầu thay đổi chưa hoàn tất",
        );
      }
      if (
        type === MembershipChangeType.FREEZE &&
        (currentMembership.freezeStartedAt ||
          (await tx.membershipChangeRequest.findFirst({
            where: {
              membershipId,
              type: MembershipChangeType.FREEZE,
              status: { not: MembershipChangeStatus.REJECTED },
            },
            select: { id: true },
          })))
      ) {
        throw new ConflictException(
          "Hợp đồng này đã yêu cầu hoặc sử dụng quyền bảo lưu",
        );
      }
      return tx.membershipChangeRequest.create({
        data: {
          membershipId,
          memberId: member.id,
          type,
          status,
          reason: dto.reason?.trim() || null,
          freezeDays:
            type === MembershipChangeType.FREEZE ? dto.freezeDays : null,
        },
        include: this.requestInclude(),
      });
    });

    await this.auditService.log({
      userId,
      action: "MEMBERSHIP_CHANGE_REQUESTED",
      entity: "MembershipChangeRequest",
      entityId: request.id,
      metadata: { membershipId, type, reason: request.reason },
    });

    await this.notificationsService.notifyAdmins(
      {
        type: "MEMBERSHIP",
        title: "Yêu cầu thay đổi hợp đồng mới",
        content: `${member.fullName} gửi yêu cầu ${this.typeLabel(type)} cho gói ${membership.package.name}.`,
        link: "/admin/memberships",
        referenceType: "MEMBERSHIP_CHANGE",
        referenceId: request.id,
      },
      userId,
    );

    return { message: "Đã gửi yêu cầu thay đổi hợp đồng", request };
  }

  async proposeRefund(
    id: string,
    actorId: string,
    dto: ProposeMembershipRefundDto,
  ) {
    const request = await this.getRequest(id);
    if (request.type !== MembershipChangeType.CANCEL_REFUND) {
      throw new ConflictException(
        "Chỉ yêu cầu chấm dứt hợp đồng mới cần đề xuất hoàn tiền",
      );
    }
    if (request.status !== MembershipChangeStatus.REQUESTED) {
      throw new ConflictException(
        "Yêu cầu không còn chờ đề xuất mức hoàn tiền",
      );
    }

    const calculation = await this.calculateRefund(request.membershipId);
    const amount = dto.refundAmount ?? calculation.amount;
    if (amount < 0 || amount > calculation.amount) {
      throw new BadRequestException(
        `Số tiền đề xuất không được vượt quá ${calculation.amount.toLocaleString("vi-VN")}đ theo chính sách`,
      );
    }
    const updatedCount = await this.prisma.membershipChangeRequest.updateMany({
      where: { id, status: MembershipChangeStatus.REQUESTED },
      data: {
        status: MembershipChangeStatus.AWAITING_MEMBER_CONFIRMATION,
        proposedRefundAmount: new Prisma.Decimal(amount.toFixed(2)),
        proposedRefundReason: dto.reason?.trim() || calculation.reason,
        reviewedAt: new Date(),
        reviewedById: actorId,
        ptSessionsUsed: calculation.ptSessionsUsed,
      },
    });
    if (updatedCount.count !== 1) {
      throw new ConflictException(
        "Yêu cầu vừa được xử lý bởi một thao tác khác",
      );
    }
    const updated = await this.getRequest(id);

    await this.notifyMember(
      request.memberId,
      "Đã có đề xuất hoàn tiền",
      `Quản lý đề xuất hoàn ${amount.toLocaleString("vi-VN")}đ cho hợp đồng. Vui lòng xác nhận hoặc liên hệ phòng tập nếu cần điều chỉnh.`,
      id,
    );
    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_REFUND_PROPOSED",
      entity: "MembershipChangeRequest",
      entityId: id,
      metadata: {
        amount,
        calculatedAmount: calculation.amount,
        ptSessionsUsed: calculation.ptSessionsUsed,
        reason: updated.proposedRefundReason,
      },
    });
    return {
      message: "Đã gửi đề xuất hoàn tiền để hội viên xác nhận",
      request: updated,
    };
  }

  async confirm(id: string, userId: string) {
    const member = await this.resolveMember(userId);
    const request = await this.getRequest(id);
    if (request.memberId !== member.id) {
      throw new ForbiddenException("Bạn không có quyền xác nhận yêu cầu này");
    }
    if (
      request.type !== MembershipChangeType.CANCEL_REFUND ||
      request.status !== MembershipChangeStatus.AWAITING_MEMBER_CONFIRMATION
    ) {
      throw new ConflictException(
        "Yêu cầu không chờ bạn xác nhận đề xuất hoàn tiền",
      );
    }

    const updatedCount = await this.prisma.membershipChangeRequest.updateMany({
      where: {
        id,
        status: MembershipChangeStatus.AWAITING_MEMBER_CONFIRMATION,
      },
      data: {
        status: MembershipChangeStatus.PENDING_MANAGER_APPROVAL,
        memberConfirmedAt: new Date(),
      },
    });
    if (updatedCount.count !== 1) {
      throw new ConflictException(
        "Yêu cầu vừa được xử lý bởi một thao tác khác",
      );
    }
    const updated = await this.getRequest(id);
    await this.notifyAdmins(
      "Hội viên đã xác nhận đề xuất hoàn tiền",
      updated.id,
    );
    await this.auditService.log({
      userId,
      action: "MEMBERSHIP_REFUND_CONFIRMED",
      entity: "MembershipChangeRequest",
      entityId: id,
      metadata: { amount: request.proposedRefundAmount },
    });
    return {
      message: "Đã xác nhận đề xuất, yêu cầu đang chờ quản lý phê duyệt",
      request: updated,
    };
  }

  async decline(id: string, userId: string, dto: ApproveMembershipChangeDto) {
    const member = await this.resolveMember(userId);
    const request = await this.getRequest(id);
    const isPendingCancellation =
      request.type === MembershipChangeType.CANCEL_REFUND &&
      request.memberId === member.id &&
      request.status === MembershipChangeStatus.AWAITING_MEMBER_CONFIRMATION;
    if (!isPendingCancellation) {
      throw new ForbiddenException(
        "Bạn không thể từ chối yêu cầu ở trạng thái hiện tại",
      );
    }

    const reason = dto.note?.trim() || "Hội viên không đồng ý với đề xuất";
    const update = await this.prisma.membershipChangeRequest.updateMany({
      where: { id, status: request.status },
      data: {
        status: MembershipChangeStatus.REJECTED,
        reviewNote: reason,
        reviewedAt: new Date(),
        reviewedById: userId,
      },
    });
    if (update.count !== 1) {
      throw new ConflictException(
        "Yêu cầu vừa được xử lý bởi một thao tác khác",
      );
    }
    await this.notifyMember(
      request.memberId,
      "Yêu cầu thay đổi hợp đồng đã kết thúc",
      reason,
      id,
    );
    await this.auditService.log({
      userId,
      action: "MEMBERSHIP_CHANGE_DECLINED",
      entity: "MembershipChangeRequest",
      entityId: id,
      metadata: { type: request.type, reason },
    });
    return {
      message: "Đã từ chối yêu cầu",
      request: await this.getRequest(id),
    };
  }

  async approve(id: string, actorId: string, dto: ApproveMembershipChangeDto) {
    const request = await this.getRequest(id);
    if (request.status !== MembershipChangeStatus.PENDING_MANAGER_APPROVAL) {
      throw new ConflictException("Yêu cầu chưa đủ điều kiện phê duyệt");
    }

    if (request.type === MembershipChangeType.CANCEL_REFUND) {
      const amount = Number(request.proposedRefundAmount ?? 0);
      if (amount > 0) {
        const updated = await this.prisma.$transaction(async (tx) => {
          const current = await tx.membershipChangeRequest.updateMany({
            where: {
              id,
              status: MembershipChangeStatus.PENDING_MANAGER_APPROVAL,
            },
            data: {
              status: MembershipChangeStatus.PENDING_PAYOUT,
              approvedAt: new Date(),
              approvedById: actorId,
              reviewNote: dto.note?.trim() || null,
            },
          });
          if (current.count !== 1) {
            throw new ConflictException(
              "Yêu cầu vừa được xử lý bởi một thao tác khác",
            );
          }
          const membership = await tx.membership.findFirst({
            where: { id: request.membershipId, status: "ACTIVE" },
            select: { id: true },
          });
          if (!membership) {
            throw new ConflictException(
              "Hợp đồng không còn hoạt động để phê duyệt hoàn tiền",
            );
          }
          return tx.membershipChangeRequest.findUniqueOrThrow({
            where: { id },
            include: this.requestInclude(),
          });
        });
        await this.auditService.log({
          userId: actorId,
          action: "MEMBERSHIP_REFUND_APPROVED",
          entity: "MembershipChangeRequest",
          entityId: id,
          metadata: { amount, note: dto.note ?? null },
        });
        return {
          message: "Đã phê duyệt; chờ ADMIN ghi nhận việc chi tiền",
          request: updated,
        };
      }

      const updated = await this.prisma.$transaction(async (tx) => {
        const current = await tx.membershipChangeRequest.updateMany({
          where: {
            id,
            status: MembershipChangeStatus.PENDING_MANAGER_APPROVAL,
          },
          data: {
            status: MembershipChangeStatus.COMPLETED,
            approvedAt: new Date(),
            approvedById: actorId,
            completedAt: new Date(),
            completedById: actorId,
            refundAmount: new Prisma.Decimal(0),
            reviewNote: dto.note?.trim() || null,
          },
        });
        if (current.count !== 1) {
          throw new ConflictException(
            "Yêu cầu vừa được xử lý bởi một thao tác khác",
          );
        }
        await this.cancelMembership(tx, request.membershipId);
        return tx.membershipChangeRequest.findUniqueOrThrow({
          where: { id },
          include: this.requestInclude(),
        });
      });
      await this.notifyMember(
        request.memberId,
        "Hợp đồng đã chấm dứt",
        "Yêu cầu chấm dứt hợp đồng không phát sinh khoản hoàn tiền và đã được phê duyệt.",
        id,
      );
      await this.auditService.log({
        userId: actorId,
        action: "MEMBERSHIP_CANCEL_COMPLETED",
        entity: "MembershipChangeRequest",
        entityId: id,
        metadata: { refundAmount: 0, note: dto.note ?? null },
      });
      return { message: "Đã phê duyệt chấm dứt hợp đồng", request: updated };
    }

    if (request.type === MembershipChangeType.FREEZE) {
      return this.approveFreeze(request, actorId, dto);
    }
    throw new ConflictException("Loại yêu cầu không được hỗ trợ");
  }

  async reject(id: string, actorId: string, dto: RejectMembershipChangeDto) {
    const reason = dto.reason.trim();
    if (!reason) throw new BadRequestException("Vui lòng nhập lý do từ chối");
    const request = await this.getRequest(id);
    if (
      !REJECTABLE_REQUEST_STATUSES.some((status) => status === request.status)
    ) {
      throw new ConflictException("Yêu cầu đã được xử lý");
    }

    const updated = await this.prisma.membershipChangeRequest.updateMany({
      where: { id, status: request.status },
      data: {
        status: MembershipChangeStatus.REJECTED,
        reviewNote: reason,
        reviewedAt: new Date(),
        reviewedById: actorId,
      },
    });
    if (updated.count !== 1) {
      throw new ConflictException(
        "Yêu cầu vừa được xử lý bởi một thao tác khác",
      );
    }
    await this.notifyMember(
      request.memberId,
      "Yêu cầu thay đổi hợp đồng bị từ chối",
      reason,
      id,
    );
    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_CHANGE_REJECTED",
      entity: "MembershipChangeRequest",
      entityId: id,
      metadata: { type: request.type, reason },
    });
    return {
      message: "Đã từ chối yêu cầu",
      request: await this.getRequest(id),
    };
  }

  async recordPayout(
    id: string,
    actorId: string,
    dto: RecordMembershipRefundDto,
  ) {
    const request = await this.getRequest(id);
    if (
      request.type !== MembershipChangeType.CANCEL_REFUND ||
      request.status !== MembershipChangeStatus.PENDING_PAYOUT
    ) {
      throw new ConflictException("Yêu cầu chưa được phê duyệt chi tiền");
    }
    if (dto.refundMethod === "BANK_TRANSFER" && !dto.refundReference?.trim()) {
      throw new BadRequestException(
        "Cần nhập mã giao dịch khi hoàn tiền bằng chuyển khoản",
      );
    }

    const amount = Number(request.proposedRefundAmount ?? 0);
    const updated = await this.prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: {
          membershipId: request.membershipId,
          status: { in: [PaymentStatus.PAID, PaymentStatus.REFUNDED] },
        },
        orderBy: [{ paidAt: "asc" }, { createdAt: "asc" }],
      });
      let outstandingRefund = amount;
      for (const payment of payments) {
        if (outstandingRefund <= 0) break;
        const paidAmount = Number(payment.amount);
        const previousRefund =
          payment.status === PaymentStatus.REFUNDED &&
          payment.refundAmount == null
            ? paidAmount
            : Number(payment.refundAmount ?? 0);
        const available = Math.max(0, paidAmount - previousRefund);
        if (!available) continue;
        const refundPart = Math.min(available, outstandingRefund);
        const totalRefund = previousRefund + refundPart;
        const fullyRefunded = totalRefund >= paidAmount;
        const paymentUpdate = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: payment.status,
            refundAmount: payment.refundAmount,
          },
          data: {
            status: fullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.PAID,
            refundAmount: new Prisma.Decimal(totalRefund.toFixed(2)),
            refundMethod: dto.refundMethod,
            confirmedById: actorId,
            confirmedAt: new Date(),
            notes: [
              payment.notes,
              `Hoàn ${refundPart.toLocaleString("vi-VN")}đ theo yêu cầu ${id}`,
            ]
              .filter(Boolean)
              .join(" | "),
          },
        });
        if (paymentUpdate.count !== 1) {
          throw new ConflictException(
            "Giao dịch vừa được thay đổi; vui lòng kiểm tra lại",
          );
        }
        if (fullyRefunded) {
          await tx.invoice.updateMany({
            where: { paymentId: payment.id, status: "PAID" },
            data: { status: "CANCELLED" },
          });
          if (payment.promotionId) {
            await tx.promotion.updateMany({
              where: { id: payment.promotionId, usedCount: { gt: 0 } },
              data: { usedCount: { decrement: 1 } },
            });
          }
        }
        outstandingRefund -= refundPart;
      }
      if (outstandingRefund > 0.001) {
        throw new ConflictException(
          "Tổng khoản đã thanh toán còn lại không đủ để chi hoàn tiền",
        );
      }

      await this.cancelMembership(tx, request.membershipId);
      const requestUpdate = await tx.membershipChangeRequest.updateMany({
        where: { id, status: MembershipChangeStatus.PENDING_PAYOUT },
        data: {
          status: MembershipChangeStatus.COMPLETED,
          refundAmount: new Prisma.Decimal(amount.toFixed(2)),
          refundMethod: dto.refundMethod,
          refundReference: dto.refundReference?.trim() || null,
          completedAt: new Date(),
          completedById: actorId,
        },
      });
      if (requestUpdate.count !== 1) {
        throw new ConflictException(
          "Yêu cầu vừa được xử lý bởi một thao tác khác",
        );
      }
      await tx.notification.create({
        data: {
          memberId: request.memberId,
          title: "Đã hoàn tiền và chấm dứt hợp đồng",
          content: `Phòng tập đã ghi nhận hoàn ${amount.toLocaleString("vi-VN")}đ qua ${dto.refundMethod === "CASH" ? "tiền mặt" : "chuyển khoản"}.`,
          type: "PAYMENT",
          link: "/member/membership",
          referenceType: "MEMBERSHIP_REFUND_PAID",
          referenceId: id,
        },
      });
      return tx.membershipChangeRequest.findUniqueOrThrow({
        where: { id },
        include: this.requestInclude(),
      });
    });

    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_REFUND_PAID",
      entity: "MembershipChangeRequest",
      entityId: id,
      metadata: {
        amount,
        method: dto.refundMethod,
        reference: dto.refundReference ?? null,
      },
    });
    return {
      message: `Đã ghi nhận chi hoàn ${amount.toLocaleString("vi-VN")}đ`,
      request: updated,
    };
  }

  private async approveFreeze(
    request: Awaited<ReturnType<MembershipChangesService["getRequest"]>>,
    actorId: string,
    dto: ApproveMembershipChangeDto,
  ) {
    const days = request.freezeDays;
    if (!days || days < 1 || days > 30) {
      throw new ConflictException("Số ngày bảo lưu không hợp lệ");
    }
    const now = new Date();
    const freezeEndsAt = new Date(now.getTime() + days * DAY_MS);
    const updated = await this.prisma.$transaction(async (tx) => {
      const currentMembership = await tx.membership.findFirst({
        where: {
          id: request.membershipId,
          status: "ACTIVE",
          freezeStartedAt: null,
          endDate: { gte: now },
        },
        select: { endDate: true },
      });
      if (!currentMembership) {
        throw new ConflictException(
          "Hợp đồng đã bảo lưu, hết hạn hoặc không còn hoạt động",
        );
      }
      const membership = await tx.membership.updateMany({
        where: {
          id: request.membershipId,
          status: "ACTIVE",
          freezeStartedAt: null,
          endDate: currentMembership.endDate,
        },
        data: {
          freezeStartedAt: now,
          freezeEndsAt,
          endDate: new Date(
            currentMembership.endDate.getTime() + days * DAY_MS,
          ),
        },
      });
      if (membership.count !== 1) {
        throw new ConflictException(
          "Hợp đồng đã bảo lưu, hết hạn hoặc không còn hoạt động",
        );
      }
      const requestUpdate = await tx.membershipChangeRequest.updateMany({
        where: {
          id: request.id,
          status: MembershipChangeStatus.PENDING_MANAGER_APPROVAL,
        },
        data: {
          status: MembershipChangeStatus.COMPLETED,
          freezeStartsAt: now,
          freezeEndsAt,
          approvedAt: now,
          approvedById: actorId,
          completedAt: now,
          completedById: actorId,
          reviewNote: dto.note?.trim() || null,
        },
      });
      if (requestUpdate.count !== 1) {
        throw new ConflictException(
          "Yêu cầu vừa được xử lý bởi một thao tác khác",
        );
      }
      return tx.membershipChangeRequest.findUniqueOrThrow({
        where: { id: request.id },
        include: this.requestInclude(),
      });
    });
    await this.notifyMember(
      request.memberId,
      "Đã phê duyệt bảo lưu hợp đồng",
      `Gói tập được bảo lưu ${days} ngày, đến ${freezeEndsAt.toLocaleDateString("vi-VN")}. Hạn hợp đồng được gia hạn tương ứng.`,
      request.id,
    );
    await this.auditService.log({
      userId: actorId,
      action: "MEMBERSHIP_FREEZE_APPROVED",
      entity: "MembershipChangeRequest",
      entityId: request.id,
      metadata: {
        days,
        freezeEndsAt: freezeEndsAt.toISOString(),
        note: dto.note ?? null,
      },
    });
    return {
      message: `Đã bảo lưu ${days} ngày và gia hạn hợp đồng tương ứng`,
      request: updated,
    };
  }

  private assertPtReconciliationRequest(
    request: Awaited<ReturnType<MembershipChangesService["getRequest"]>>,
  ) {
    if (
      request.type !== MembershipChangeType.CANCEL_REFUND ||
      request.status !== MembershipChangeStatus.REQUESTED
    ) {
      throw new ConflictException(
        "Chỉ yêu cầu chấm dứt đang chờ đề xuất mới được đối soát PT",
      );
    }
  }

  private async calculateRefund(membershipId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: membershipId },
      include: {
        payments: true,
        package: { select: { sessions: true } },
      },
    });
    if (!membership) throw new NotFoundException("Không tìm thấy hợp đồng");

    const paidAmount = membership.payments
      .filter((payment) =>
        [PaymentStatus.PAID, PaymentStatus.REFUNDED].includes(
          payment.status as never,
        ),
      )
      .reduce((total, payment) => {
        const amount = Number(payment.amount);
        const refunded =
          payment.status === PaymentStatus.REFUNDED &&
          payment.refundAmount == null
            ? amount
            : Number(payment.refundAmount ?? 0);
        return total + Math.max(0, amount - refunded);
      }, 0);
    const included = membership.ptSessionsIncluded ?? 0;
    if (membership.ptSessionsIncluded === null && membership.package.sessions) {
      throw new ConflictException(
        "Hợp đồng chưa có quota PT được lưu. Cần đối soát số buổi đã dùng và còn lại trước khi đề xuất hoàn tiền",
      );
    }
    const sessionValue =
      membership.ptSessionValue == null
        ? null
        : Number(membership.ptSessionValue);
    if (included > 0 && sessionValue === null) {
      throw new ConflictException(
        "Hợp đồng chưa có giá trị PT được lưu. Cần xác minh hồ sơ và cấu hình giá trước khi đề xuất hoàn tiền",
      );
    }

    const grossPaidAmount = membership.payments
      .filter((payment) =>
        [PaymentStatus.PAID, PaymentStatus.REFUNDED].includes(
          payment.status as never,
        ),
      )
      .reduce((total, payment) => total + Number(payment.amount), 0);
    const contractValue =
      grossPaidAmount || Number(membership.finalAmount ?? membership.price);

    const usedSessions = await this.usedPtSessions(
      this.prisma,
      membership.id,
      membership.ptSessionsUsed,
    );
    if (usedSessions > included) {
      throw new ConflictException(
        "Số buổi PT đã dùng vượt quota hợp đồng; cần đối soát trước khi hoàn tiền",
      );
    }
    const frozenDuration =
      membership.freezeStartedAt && membership.freezeEndsAt
        ? Math.max(
            0,
            membership.freezeEndsAt.getTime() -
              membership.freezeStartedAt.getTime(),
          )
        : 0;
    const duration = Math.max(
      1,
      membership.endDate.getTime() -
        membership.startDate.getTime() -
        frozenDuration,
    );
    const remaining = Math.max(
      0,
      Math.min(duration, membership.endDate.getTime() - Date.now()),
    );
    const ptValue = included * (sessionValue ?? 0);
    const serviceValue = Math.max(0, contractValue - ptValue);
    const unusedServiceValue = serviceValue * (remaining / duration);
    const unusedPtValue = (included - usedSessions) * (sessionValue ?? 0);
    const amount =
      Math.floor(
        Math.min(paidAmount, unusedServiceValue + unusedPtValue) * 100,
      ) / 100;
    const reason =
      `Thời gian chưa sử dụng: ${Math.floor((remaining / DAY_MS) * 100) / 100} ngày; ` +
      `PT đã dùng: ${usedSessions}/${included}; ` +
      `giá trị tính theo phần dịch vụ còn lại và quota PT chưa sử dụng.`;
    return { amount, reason, ptSessionsUsed: usedSessions };
  }

  private async usedPtSessions(
    client: Prisma.TransactionClient | PrismaService,
    membershipId: string,
    recordedCount: number,
  ) {
    const completedCount = await client.trainingSchedule.count({
      where: {
        membershipId,
        type: "PERSONAL_TRAINING",
        status: "COMPLETED",
      },
    });
    return Math.max(recordedCount, completedCount);
  }

  private async cancelMembership(
    tx: Prisma.TransactionClient,
    membershipId: string,
  ) {
    const membership = await tx.membership.updateMany({
      where: { id: membershipId, status: { in: ["ACTIVE", "SUSPENDED"] } },
      data: {
        status: "CANCELLED",
        cancelRequestedAt: null,
        cancelRequestReason: null,
      },
    });
    if (membership.count !== 1) {
      throw new ConflictException(
        "Hợp đồng không còn ở trạng thái có thể chấm dứt",
      );
    }
    await tx.payment.updateMany({
      where: { membershipId, status: PaymentStatus.PENDING },
      data: {
        status: PaymentStatus.CANCELLED,
        notes: "Hủy theo yêu cầu chấm dứt hợp đồng",
      },
    });
  }

  private async getRequest(id: string) {
    const request = await this.prisma.membershipChangeRequest.findUnique({
      where: { id },
      include: this.requestInclude(),
    });
    if (!request)
      throw new NotFoundException("Không tìm thấy yêu cầu thay đổi hợp đồng");
    return request;
  }

  private requestInclude() {
    return {
      membership: {
        include: {
          package: {
            select: {
              id: true,
              name: true,
              durationDays: true,
              price: true,
              sessions: true,
              ptSessionValue: true,
            },
          },
          member: { select: { id: true, code: true, fullName: true } },
        },
      },
      member: { select: { id: true, code: true, fullName: true } },
      reviewedBy: { select: { id: true, fullName: true } },
      approvedBy: { select: { id: true, fullName: true } },
      completedBy: { select: { id: true, fullName: true } },
    } satisfies Prisma.MembershipChangeRequestInclude;
  }

  private async resolveMember(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member)
      throw new ForbiddenException("Tài khoản không gắn với hồ sơ hội viên");
    return member;
  }

  private async notifyMember(
    memberId: string,
    title: string,
    content: string,
    requestId: string,
  ) {
    await this.prisma.notification.create({
      data: {
        memberId,
        title,
        content,
        type: "MEMBERSHIP",
        link: "/member/membership",
        referenceType: "MEMBERSHIP_CHANGE",
        referenceId: requestId,
      },
    });
  }

  private async notifyAdmins(content: string, requestId: string) {
    await this.notificationsService.notifyAdmins({
      type: "MEMBERSHIP",
      title: "Yêu cầu thay đổi hợp đồng cần phê duyệt",
      content,
      link: "/admin/memberships",
      referenceType: "MEMBERSHIP_CHANGE",
      referenceId: requestId,
    });
  }

  private typeLabel(type: string) {
    if (type === MembershipChangeType.CANCEL_REFUND)
      return "chấm dứt/hoàn tiền";
    return "bảo lưu";
  }
}
