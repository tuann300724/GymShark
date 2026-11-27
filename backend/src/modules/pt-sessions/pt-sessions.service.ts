import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatService } from "../chat/chat.service";
import {
  AcceptPtSessionDto,
  CreatePtSessionDto,
  DeclinePtSessionDto,
  PtSessionQueryDto,
} from "./dto/pt-session.dto";

const trainerSelect = {
  id: true,
  userId: true,
  commissionRate: true,
  user: { select: { fullName: true, avatarUrl: true } },
} satisfies Prisma.TrainerSelect;

const memberSelect = {
  id: true,
  code: true,
  fullName: true,
  phone: true,
  userId: true,
} satisfies Prisma.MemberSelect;

const fmtTime = (d: Date) =>
  d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });

/**
 * Buổi tập PT hội viên tự đặt qua chat (không cần admin phân công PT):
 *   PT đề nghị (OFFERED) → hội viên chấp nhận → Payment PENDING (AWAITING_PAYMENT)
 *   → admin/CASSO xác nhận (PaymentsService → onPtSessionPaymentPaid) → PAID + TrainingSchedule.
 * Doanh thu về GymMaster; PT nhận trainerEarning = price − platformFee (theo % chiết khấu),
 * admin chi trả sau cho các buổi đã diễn ra (payoutStatus UNPAID → PAID_OUT).
 */
@Injectable()
export class PtSessionsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private chat: ChatService,
  ) {}

  // ---------------------------------------------------------------------------
  // PT
  // ---------------------------------------------------------------------------

  async create(trainerUserId: string, dto: CreatePtSessionDto) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId: trainerUserId },
      select: { ...trainerSelect, status: true, ownerPartnerId: true },
    });
    if (!trainer) throw new ForbiddenException("Tài khoản chưa gắn hồ sơ huấn luyện viên.");
    if (trainer.ownerPartnerId)
      throw new ForbiddenException(
        "PT của phòng gym đối tác không nhận đặt buổi trả phí qua GymMaster.",
      );
    if (trainer.status !== "ACTIVE")
      throw new BadRequestException("Tài khoản PT đang không hoạt động.");

    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      select: { ...memberSelect, status: true },
    });
    if (!member || !member.userId) throw new NotFoundException("Không tìm thấy hội viên.");
    const conversation = await this.prisma.conversation.findUnique({
      where: { trainerId_memberId: { trainerId: trainer.id, memberId: member.id } },
      select: { id: true },
    });
    if (!conversation)
      throw new BadRequestException(
        "Hội viên cần nhắn tin với bạn trước khi bạn gửi đề nghị buổi tập.",
      );

    const startTime = new Date(dto.startTime);
    if (startTime.getTime() < Date.now() + 15 * 60_000)
      throw new BadRequestException("Thời gian bắt đầu phải cách hiện tại ít nhất 15 phút.");
    const endTime = new Date(startTime.getTime() + dto.durationMinutes * 60_000);
    await this.assertNoOverlap(trainer.id, startTime, endTime);

    const rate = Number(trainer.commissionRate);
    const price = Math.round(dto.price);
    const platformFee = Math.round((price * rate) / 100);

    const session = await this.prisma.ptSession.create({
      data: {
        trainerId: trainer.id,
        memberId: member.id,
        conversationId: conversation.id,
        title: dto.title.trim(),
        note: dto.note?.trim() || null,
        startTime,
        endTime,
        price,
        commissionRate: rate,
        platformFee,
        trainerEarning: price - platformFee,
      },
    });

    await this.chat.sendPtSessionMessage({
      trainerUserId: trainerUserId,
      trainerId: trainer.id,
      memberId: member.id,
      ptSessionId: session.id,
      content: `Đề nghị buổi tập: ${session.title}`,
    });
    await this.audit.log({
      userId: trainerUserId,
      action: "PT_SESSION_OFFER",
      entity: "PtSession",
      entityId: session.id,
      metadata: { memberCode: member.code, price, startTime: startTime.toISOString() },
    });
    return { message: "Đã gửi đề nghị buổi tập cho hội viên.", session };
  }

  async cancelByTrainer(trainerUserId: string, id: string) {
    const session = await this.findForTrainer(trainerUserId, id);
    if (session.status !== "OFFERED")
      throw new BadRequestException(
        "Chỉ huỷ được đề nghị hội viên chưa chấp nhận. Buổi đã thanh toán vui lòng liên hệ quản trị viên.",
      );
    await this.prisma.ptSession.update({ where: { id }, data: { status: "CANCELLED" } });
    await this.emitUpdated(session);
    return { message: "Đã huỷ đề nghị buổi tập." };
  }

  /** PT: danh sách buổi + tổng thu nhập */
  async listForTrainer(trainerUserId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId: trainerUserId },
      select: { id: true, commissionRate: true },
    });
    if (!trainer) throw new ForbiddenException("Tài khoản chưa gắn hồ sơ huấn luyện viên.");
    const sessions = await this.prisma.ptSession.findMany({
      where: { trainerId: trainer.id },
      include: { member: { select: memberSelect } },
      orderBy: { startTime: "desc" },
      take: 200,
    });
    const paid = sessions.filter((s) => s.status === "PAID");
    const sum = (rows: typeof sessions, key: "price" | "trainerEarning" | "platformFee") =>
      rows.reduce((t, s) => t + Number(s[key]), 0);
    return {
      commissionRate: Number(trainer.commissionRate),
      summary: {
        paidSessions: paid.length,
        grossRevenue: sum(paid, "price"),
        totalEarning: sum(paid, "trainerEarning"),
        pendingPayout: sum(
          paid.filter((s) => s.payoutStatus === "UNPAID"),
          "trainerEarning",
        ),
        paidOut: sum(
          paid.filter((s) => s.payoutStatus === "PAID_OUT"),
          "trainerEarning",
        ),
      },
      data: sessions,
    };
  }

  // ---------------------------------------------------------------------------
  // Hội viên
  // ---------------------------------------------------------------------------

  async listForMember(memberUserId: string) {
    const member = await this.requireMember(memberUserId);
    return this.prisma.ptSession.findMany({
      where: { memberId: member.id },
      include: { trainer: { select: trainerSelect } },
      orderBy: { startTime: "desc" },
      take: 100,
    });
  }

  /** Hội viên chấp nhận đề nghị → tạo Payment + Invoice PENDING (thanh toán như gói tập) */
  async accept(memberUserId: string, id: string, dto: AcceptPtSessionDto) {
    const member = await this.requireMember(memberUserId);
    const session = await this.prisma.ptSession.findUnique({
      where: { id },
      include: { trainer: { select: trainerSelect } },
    });
    if (!session || session.memberId !== member.id)
      throw new NotFoundException("Không tìm thấy đề nghị buổi tập.");
    if (session.status !== "OFFERED")
      throw new BadRequestException("Đề nghị này không còn chờ bạn xác nhận.");
    if (session.startTime.getTime() <= Date.now())
      throw new BadRequestException("Buổi tập đã quá giờ bắt đầu, hãy nhờ PT gửi đề nghị mới.");
    await this.assertNoOverlap(session.trainerId, session.startTime, session.endTime, id);

    const code = await this.genPaymentCode();
    const method = dto.paymentMethod ?? "BANK_TRANSFER";
    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          code,
          memberId: member.id,
          membershipId: null,
          amount: session.price,
          method,
          status: "PENDING",
          notes: `[PT_SESSION:${session.id}] Buổi PT "${session.title}" với HLV ${session.trainer.user.fullName} — ${fmtTime(session.startTime)}`,
        },
        select: { id: true, code: true, amount: true },
      });
      await tx.invoice.create({
        data: {
          invoiceNumber: code,
          memberId: member.id,
          paymentId: created.id,
          subtotal: session.price,
          discount: 0,
          total: session.price,
          status: "ISSUED",
          issuedAt: new Date(),
          dueDate: session.startTime,
        },
      });
      // Chỉ chuyển trạng thái nếu vẫn OFFERED (chặn bấm chấp nhận 2 lần đồng thời)
      const moved = await tx.ptSession.updateMany({
        where: { id, status: "OFFERED" },
        data: { status: "AWAITING_PAYMENT", paymentId: created.id, respondedAt: new Date() },
      });
      if (moved.count !== 1) throw new ConflictException("Đề nghị vừa được xử lý ở nơi khác.");
      return created;
    });

    await this.notifications.create({
      userId: session.trainer.userId,
      type: "SYSTEM",
      title: "Hội viên đã chấp nhận buổi tập",
      content: `${member.fullName} đã chấp nhận buổi "${session.title}" (${fmtTime(session.startTime)}) và đang thanh toán.`,
      link: "/trainer/messages",
    });
    await this.notifications.notifyAdmins({
      type: "PAYMENT",
      title: "Thanh toán buổi PT chờ xác nhận",
      content: `${member.fullName} (${member.code}) thanh toán ${Number(session.price).toLocaleString("vi-VN")}đ cho buổi PT với ${session.trainer.user.fullName} — hoá đơn ${code}.`,
      link: `/admin/payments/${payment.id}`,
      referenceType: "PT_SESSION_PAYMENT",
      referenceId: payment.id,
    });
    await this.audit.log({
      userId: memberUserId,
      action: "PT_SESSION_ACCEPT",
      entity: "PtSession",
      entityId: id,
      metadata: { paymentCode: code, amount: Number(session.price), method },
    });
    await this.emitUpdated({ ...session, member });

    return {
      message: "Đã chấp nhận buổi tập. Vui lòng thanh toán để GymMaster xác nhận lịch.",
      payment: { id: payment.id, code: payment.code, amount: Number(payment.amount) },
    };
  }

  async decline(memberUserId: string, id: string, dto: DeclinePtSessionDto) {
    const member = await this.requireMember(memberUserId);
    const session = await this.prisma.ptSession.findUnique({
      where: { id },
      include: { trainer: { select: trainerSelect } },
    });
    if (!session || session.memberId !== member.id)
      throw new NotFoundException("Không tìm thấy đề nghị buổi tập.");
    if (session.status !== "OFFERED")
      throw new BadRequestException("Đề nghị này không còn chờ bạn xác nhận.");
    const reason = dto.reason?.trim() || null;
    await this.prisma.ptSession.update({
      where: { id },
      data: { status: "DECLINED", declineReason: reason, respondedAt: new Date() },
    });
    await this.notifications.create({
      userId: session.trainer.userId,
      type: "SYSTEM",
      title: "Hội viên từ chối buổi tập",
      content: `${member.fullName} đã từ chối buổi "${session.title}"${reason ? `: ${reason}` : "."}`,
      link: "/trainer/messages",
    });
    await this.emitUpdated({ ...session, member });
    return { message: "Đã từ chối đề nghị buổi tập." };
  }

  // ---------------------------------------------------------------------------
  // Admin — đối soát & chi trả cho PT
  // ---------------------------------------------------------------------------

  async adminList(query: PtSessionQueryDto) {
    const where: Prisma.PtSessionWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.payoutStatus ? { payoutStatus: query.payoutStatus } : {}),
      ...(query.trainerId ? { trainerId: query.trainerId } : {}),
    };
    const [data, paid] = await Promise.all([
      this.prisma.ptSession.findMany({
        where,
        include: {
          trainer: { select: trainerSelect },
          member: { select: memberSelect },
        },
        orderBy: { startTime: "desc" },
        take: 300,
      }),
      this.prisma.ptSession.findMany({
        where: { status: "PAID" },
        select: {
          trainerId: true,
          price: true,
          platformFee: true,
          trainerEarning: true,
          payoutStatus: true,
          endTime: true,
          trainer: { select: trainerSelect },
        },
      }),
    ]);

    // Tổng hợp theo PT: doanh thu, phần GymMaster giữ, phần PT, còn nợ PT (đã diễn ra, chưa chi)
    const now = Date.now();
    const byTrainer = new Map<
      string,
      {
        trainerId: string;
        fullName: string;
        avatarUrl: string | null;
        commissionRate: number;
        sessions: number;
        gross: number;
        platformFee: number;
        trainerEarning: number;
        payable: number;
        payableSessions: number;
        upcomingEarning: number;
        paidOut: number;
      }
    >();
    for (const s of paid) {
      const row =
        byTrainer.get(s.trainerId) ??
        {
          trainerId: s.trainerId,
          fullName: s.trainer.user.fullName,
          avatarUrl: s.trainer.user.avatarUrl,
          commissionRate: Number(s.trainer.commissionRate),
          sessions: 0,
          gross: 0,
          platformFee: 0,
          trainerEarning: 0,
          payable: 0,
          payableSessions: 0,
          upcomingEarning: 0,
          paidOut: 0,
        };
      row.sessions += 1;
      row.gross += Number(s.price);
      row.platformFee += Number(s.platformFee);
      row.trainerEarning += Number(s.trainerEarning);
      if (s.payoutStatus === "PAID_OUT") row.paidOut += Number(s.trainerEarning);
      else if (s.endTime.getTime() <= now) {
        row.payable += Number(s.trainerEarning);
        row.payableSessions += 1;
      } else row.upcomingEarning += Number(s.trainerEarning);
      byTrainer.set(s.trainerId, row);
    }
    const trainers = [...byTrainer.values()].sort((a, b) => b.payable - a.payable);
    const totals = trainers.reduce(
      (t, r) => ({
        gross: t.gross + r.gross,
        platformFee: t.platformFee + r.platformFee,
        trainerEarning: t.trainerEarning + r.trainerEarning,
        payable: t.payable + r.payable,
        paidOut: t.paidOut + r.paidOut,
      }),
      { gross: 0, platformFee: 0, trainerEarning: 0, payable: 0, paidOut: 0 },
    );
    return { data, trainers, totals };
  }

  /** Admin đánh dấu đã chi trả phần của PT cho mọi buổi đã thanh toán + đã diễn ra */
  async payout(trainerId: string, actorId: string) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { id: trainerId },
      select: trainerSelect,
    });
    if (!trainer) throw new NotFoundException("Không tìm thấy huấn luyện viên.");
    const now = new Date();
    const due = await this.prisma.ptSession.findMany({
      where: { trainerId, status: "PAID", payoutStatus: "UNPAID", endTime: { lte: now } },
      select: { id: true, trainerEarning: true },
    });
    if (due.length === 0)
      throw new BadRequestException("PT này không có buổi nào đến hạn chi trả.");
    const amount = due.reduce((t, s) => t + Number(s.trainerEarning), 0);
    await this.prisma.ptSession.updateMany({
      where: { id: { in: due.map((s) => s.id) }, payoutStatus: "UNPAID" },
      data: { payoutStatus: "PAID_OUT", payoutAt: now, payoutById: actorId },
    });
    await this.audit.log({
      userId: actorId,
      action: "PT_PAYOUT",
      entity: "Trainer",
      entityId: trainerId,
      metadata: { sessions: due.length, amount },
    });
    await this.notifications.create({
      userId: trainer.userId,
      type: "PAYMENT",
      title: "GymMaster đã chi trả thu nhập buổi PT 💸",
      content: `Đã chi trả ${amount.toLocaleString("vi-VN")}đ cho ${due.length} buổi tập (sau chiết khấu).`,
      link: "/trainer/earnings",
    });
    return {
      message: `Đã ghi nhận chi trả ${amount.toLocaleString("vi-VN")}đ cho ${trainer.user.fullName} (${due.length} buổi).`,
      sessions: due.length,
      amount,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async requireMember(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { userId },
      select: memberSelect,
    });
    if (!member) throw new ForbiddenException("Tài khoản này không gắn với hồ sơ hội viên.");
    return member;
  }

  private async findForTrainer(trainerUserId: string, id: string) {
    const session = await this.prisma.ptSession.findUnique({
      where: { id },
      include: { trainer: { select: trainerSelect }, member: { select: memberSelect } },
    });
    if (!session || session.trainer.userId !== trainerUserId)
      throw new NotFoundException("Không tìm thấy buổi tập.");
    return session;
  }

  /** PT không bị trùng giờ với lịch dạy hoặc đề nghị đang chờ thanh toán khác */
  private async assertNoOverlap(trainerId: string, start: Date, end: Date, excludeId?: string) {
    const [schedule, pending] = await Promise.all([
      this.prisma.trainingSchedule.findFirst({
        where: { trainerId, status: "SCHEDULED", startTime: { lt: end }, endTime: { gt: start } },
        select: { id: true },
      }),
      this.prisma.ptSession.findFirst({
        where: {
          trainerId,
          status: "AWAITING_PAYMENT",
          startTime: { lt: end },
          endTime: { gt: start },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      }),
    ]);
    if (schedule || pending)
      throw new ConflictException("PT đã có lịch dạy trùng khung giờ này.");
  }

  private async emitUpdated(session: {
    id: string;
    conversationId: string | null;
    trainer: { userId: string };
    member?: { userId: string | null };
  }) {
    await this.chat.emitPtSessionUpdated({
      trainerUserId: session.trainer.userId,
      memberUserId: session.member?.userId ?? null,
      conversationId: session.conversationId,
      ptSessionId: session.id,
    });
  }

  /** Mã hoá đơn INV-YYYY-NNNN — cùng dải với hoá đơn gói tập */
  private async genPaymentCode(): Promise<string> {
    const prefix = `INV-${new Date().getFullYear()}-`;
    const last = await this.prisma.payment.findFirst({
      where: { code: { startsWith: prefix } },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    let seq = last ? parseInt(last.code.slice(prefix.length), 10) || 0 : 0;
    for (let i = 0; i < 500; i++) {
      seq += 1;
      const code = `${prefix}${String(seq).padStart(4, "0")}`;
      const [pay, inv] = await Promise.all([
        this.prisma.payment.findUnique({ where: { code }, select: { id: true } }),
        this.prisma.invoice.findUnique({ where: { invoiceNumber: code }, select: { id: true } }),
      ]);
      if (!pay && !inv) return code;
    }
    throw new ConflictException("Không tạo được mã hoá đơn, vui lòng thử lại.");
  }
}
