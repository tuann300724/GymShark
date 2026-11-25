import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { MessageType } from "../../common/constants/db-enums";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ChatGateway } from "./chat.gateway";
import {
  ConversationQueryDto,
  MessageQueryDto,
  SendMessageDto,
  StartConversationDto,
} from "./dto/chat.dto";

export type ChatActor =
  | { kind: "TRAINER"; userId: string; trainerId: string }
  | { kind: "MEMBER"; userId: string; memberId: string };

const conversationInclude = {
  member: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      code: true,
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  },
  trainer: {
    select: {
      id: true,
      user: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.ConversationInclude;

const messageInclude = {
  sender: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
  attachments: true,
  mealPlan: {
    include: {
      meals: {
        orderBy: { orderIndex: "asc" as const },
        include: { items: { orderBy: { orderIndex: "asc" as const } } },
      },
    },
  },
} satisfies Prisma.MessageInclude;

type ConversationRow = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}> & {
  _count: { messages: number };
};

type MessageRow = Prisma.MessageGetPayload<{ include: typeof messageInclude }>;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly gateway: ChatGateway,
  ) {}

  // ---------------------------------------------------------------------------
  // Danh tính người dùng → hồ sơ HLV/hội viên
  // ---------------------------------------------------------------------------

  async resolveActor(user: { id: string; role: string }): Promise<ChatActor> {
    if (user.role === "TRAINER") {
      const trainer = await this.prisma.trainer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!trainer)
        throw new ForbiddenException(
          "Tài khoản chưa gắn hồ sơ huấn luyện viên.",
        );
      return { kind: "TRAINER", userId: user.id, trainerId: trainer.id };
    }

    if (user.role === "MEMBER") {
      const member = await this.prisma.member.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!member)
        throw new ForbiddenException("Tài khoản chưa gắn hồ sơ hội viên.");
      return { kind: "MEMBER", userId: user.id, memberId: member.id };
    }

    throw new ForbiddenException(
      "Chỉ huấn luyện viên và hội viên sử dụng được khu vực trò chuyện.",
    );
  }

  /** Chỉ cho phép khi còn phân công TrainerMember ACTIVE giữa HLV và hội viên. */
  private async assertAssignment(trainerId: string, memberId: string) {
    const assignment = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!assignment) {
      throw new ForbiddenException(
        "Bạn chỉ có thể trò chuyện với hội viên đang được phân công phụ trách.",
      );
    }
    return assignment;
  }

  // ---------------------------------------------------------------------------
  // Đồng bộ cuộc trò chuyện theo phân công hiện tại
  // ---------------------------------------------------------------------------

  private async syncTrainerConversations(trainerId: string) {
    const assignments = await this.prisma.trainerMember.findMany({
      where: { trainerId, status: "ACTIVE" },
      select: { memberId: true },
    });
    if (!assignments.length) return;
    await this.prisma.$transaction(
      assignments.map((a) =>
        this.prisma.conversation.upsert({
          where: { trainerId_memberId: { trainerId, memberId: a.memberId } },
          create: { trainerId, memberId: a.memberId },
          update: {},
        }),
      ),
    );
  }

  private async syncMemberConversations(memberId: string) {
    const assignments = await this.prisma.trainerMember.findMany({
      where: { memberId, status: "ACTIVE" },
      select: { trainerId: true },
    });
    if (!assignments.length) return;
    await this.prisma.$transaction(
      assignments.map((a) =>
        this.prisma.conversation.upsert({
          where: { trainerId_memberId: { trainerId: a.trainerId, memberId } },
          create: { trainerId: a.trainerId, memberId },
          update: {},
        }),
      ),
    );
  }

  private async ensureConversation(
    trainerId: string,
    memberId: string,
    requireAssignment = true,
  ) {
    if (requireAssignment) await this.assertAssignment(trainerId, memberId);
    return this.prisma.conversation.upsert({
      where: { trainerId_memberId: { trainerId, memberId } },
      create: { trainerId, memberId },
      update: {},
    });
  }

  // ---------------------------------------------------------------------------
  // Truy vấn
  // ---------------------------------------------------------------------------

  private mapConversation(
    conversation: ConversationRow,
    actor: ChatActor,
    myUserId: string,
  ) {
    const isTrainer = actor.kind === "TRAINER";
    const partnerName = isTrainer
      ? conversation.member.fullName
      : conversation.trainer.user.fullName;
    const partnerAvatar = isTrainer
      ? (conversation.member.avatarUrl ??
        conversation.member.user?.avatarUrl ??
        null)
      : conversation.trainer.user.avatarUrl;

    return {
      id: conversation.id,
      partner: {
        type: isTrainer ? "MEMBER" : "TRAINER",
        id: isTrainer ? conversation.member.id : conversation.trainer.id,
        userId: isTrainer
          ? (conversation.member.user?.id ?? null)
          : conversation.trainer.user.id,
        name: partnerName,
        avatarUrl: partnerAvatar,
        code: isTrainer ? conversation.member.code : null,
      },
      lastMessageAt: conversation.lastMessageAt,
      lastMessagePreview: conversation.lastMessagePreview,
      status: conversation.status,
      unreadCount: conversation._count.messages,
      myUserId,
    };
  }

  async listConversations(
    user: { id: string; role: string },
    query: ConversationQueryDto,
  ) {
    const actor = await this.resolveActor(user);

    if (actor.kind === "TRAINER")
      await this.syncTrainerConversations(actor.trainerId);
    else await this.syncMemberConversations(actor.memberId);

    // HLV thấy mọi hội thoại của mình, kể cả hội viên chủ động nhắn mà chưa
    // được phân công (luồng mới cho phép MEMBER nhắn trực tiếp HLV ACTIVE).
    const where: Prisma.ConversationWhereInput =
      actor.kind === "TRAINER"
        ? { trainerId: actor.trainerId }
        : { memberId: actor.memberId };

    if (actor.kind === "TRAINER" && query.search) {
      where.member = { fullName: { contains: query.search.trim() } };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 30));

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: {
          ...conversationInclude,
          _count: {
            select: {
              messages: {
                where: { isRead: false, senderId: { not: user.id } },
              },
            },
          },
        },
        orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    let data = rows.map((row) =>
      this.mapConversation(row as ConversationRow, actor, user.id),
    );
    if (query.unreadOnly) data = data.filter((c) => c.unreadCount > 0);

    return { data, total, page, limit };
  }

  private async getConversationForActor(
    actor: ChatActor,
    conversationId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        trainer: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        member: {
          select: { id: true, userId: true, fullName: true, avatarUrl: true },
        },
      },
    });

    if (!conversation)
      throw new NotFoundException("Không tìm thấy cuộc trò chuyện.");
    if (
      actor.kind === "TRAINER" &&
      conversation.trainerId !== actor.trainerId
    ) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập cuộc trò chuyện này.",
      );
    }
    if (actor.kind === "MEMBER" && conversation.memberId !== actor.memberId) {
      throw new ForbiddenException(
        "Bạn không có quyền truy cập cuộc trò chuyện này.",
      );
    }
    return conversation;
  }

  async listMessages(
    user: { id: string; role: string },
    conversationId: string,
    query: MessageQueryDto,
  ) {
    const actor = await this.resolveActor(user);
    const conversation = await this.getConversationForActor(
      actor,
      conversationId,
    );

    // Receipt "đã nhận": thiết bị của người xem đang mở cuộc trò chuyện này
    const undelivered = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, deliveredAt: null },
      data: { deliveredAt: new Date() },
    });
    if (undelivered.count > 0) {
      const otherUserId =
        actor.kind === "TRAINER"
          ? conversation.member.userId
          : conversation.trainer.userId;
      this.gateway.emitToUser(otherUserId, "messages:delivered", {
        conversationIds: [conversationId],
      });
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        include: messageInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    // Tin nhắn đã thu hồi: ẩn nội dung thực đơn (nếu có) — nội dung text/ảnh đã bị
    // xoá vĩnh viễn trong DB nên chỉ cần che phần còn lại tại đây.
    const data = rows
      .reverse()
      .map((m) => (m.recalledAt ? { ...m, mealPlan: null } : m));

    return { data, total, page, limit };
  }

  async unreadCount(user: { id: string; role: string }) {
    const actor = await this.resolveActor(user);
    await (actor.kind === "TRAINER"
      ? this.syncTrainerConversations(actor.trainerId)
      : this.syncMemberConversations(actor.memberId));

    const where: Prisma.MessageWhereInput = {
      isRead: false,
      senderId: { not: user.id },
      conversation:
        actor.kind === "TRAINER"
          ? { trainerId: actor.trainerId }
          : { memberId: actor.memberId },
    };

    const count = await this.prisma.message.count({ where });
    return { count };
  }

  // ---------------------------------------------------------------------------
  // Ghi dữ liệu
  // ---------------------------------------------------------------------------

  async startConversation(
    user: { id: string; role: string },
    dto: StartConversationDto,
  ) {
    const actor = await this.resolveActor(user);

    let trainerId: string;
    let memberId: string;
    let requireAssignment = true;

    if (actor.kind === "TRAINER") {
      if (!dto.memberId) {
        throw new BadRequestException("Thiếu ID hội viên cần nhắn tin.");
      }
      trainerId = actor.trainerId;
      memberId = dto.memberId;
    } else {
      if (!dto.trainerId) {
        throw new BadRequestException("Thiếu ID huấn luyện viên cần nhắn tin.");
      }
      const trainer = await this.prisma.trainer.findFirst({
        where: { id: dto.trainerId, status: "ACTIVE" },
        select: { id: true },
      });
      if (!trainer) {
        throw new NotFoundException("Không tìm thấy huấn luyện viên đang hoạt động.");
      }
      trainerId = trainer.id;
      memberId = actor.memberId;
      // Hội viên đã đăng nhập được nhắn bất kỳ HLV ACTIVE, không cần phân công.
      requireAssignment = false;
    }

    const conversation = await this.ensureConversation(
      trainerId,
      memberId,
      requireAssignment,
    );

    const row = await this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        ...conversationInclude,
        _count: {
          select: {
            messages: { where: { isRead: false, senderId: { not: user.id } } },
          },
        },
      },
    });

    return this.mapConversation(row as ConversationRow, actor, user.id);
  }

  private previewOf(message: {
    type: string;
    content: string | null;
    recalledAt?: Date | null;
  }): string {
    if (message.recalledAt) return "[Tin nhắn đã được thu hồi]";
    const text = (message.content ?? "").trim();
    if (text) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
    if (message.type === "IMAGE") return "[Hình ảnh]";
    if (message.type === "MEAL_PLAN") return "[Thực đơn dinh dưỡng]";
    return "Tin nhắn";
  }

  private recipientUserId(conversation: {
    trainer: { userId: string };
    member: { userId: string | null };
  }): string {
    return conversation.member.userId ?? conversation.trainer.userId;
  }

  async sendMessage(
    user: { id: string; role: string },
    conversationId: string,
    dto: SendMessageDto,
  ) {
    const actor = await this.resolveActor(user);
    const conversation = await this.getConversationForActor(
      actor,
      conversationId,
    );

    // Không kiểm tra phân công ở đây: hội viên đã đăng nhập có thể chủ động
    // nhắn bất kỳ HLV ACTIVE; quyền truy cập hội thoại đã được kiểm tra ở trên.

    const attachments = dto.attachments ?? [];
    const explicitType = dto.type;
    if (
      explicitType === MessageType.MEAL_PLAN ||
      explicitType === MessageType.SYSTEM
    ) {
      throw new BadRequestException(
        "Loại tin nhắn này không gửi trực tiếp qua API.",
      );
    }

    const type: MessageType =
      explicitType ??
      (attachments.length ? MessageType.IMAGE : MessageType.TEXT);
    const content = dto.content?.trim() ?? "";

    if (type === MessageType.TEXT && !content) {
      throw new BadRequestException("Nội dung tin nhắn không được để trống.");
    }
    if (type === MessageType.IMAGE && attachments.length === 0) {
      throw new BadRequestException(
        "Tin nhắn hình ảnh cần có ít nhất một tệp.",
      );
    }

    const created = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        type,
        content: content || null,
        attachments: attachments.length
          ? {
              create: attachments.map((a) => ({
                kind: a.kind ?? "IMAGE",
                fileName: a.fileName ?? null,
                mimeType: a.mimeType ?? null,
                sizeBytes: a.sizeBytes ?? null,
                dataUrl: a.dataUrl,
                width: a.width ?? null,
                height: a.height ?? null,
              })),
            }
          : undefined,
      },
      include: messageInclude,
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: created.createdAt,
        lastMessagePreview: this.previewOf(created),
      },
    });

    // Receipt "đã nhận": nếu thiết bị người nhận đang online, đánh dấu ngay.
    const recipientUserId =
      user.id === conversation.trainer.userId
        ? conversation.member.userId
        : conversation.trainer.userId;
    const messageOut = await this.markDeliveredIfOnline(
      created,
      user.id,
      recipientUserId,
    );

    const participants = [
      conversation.trainer.userId,
      conversation.member.userId ?? conversation.trainer.userId,
    ];
    for (const uid of participants) {
      this.gateway.emitToUser(uid, "message:new", {
        conversationId,
        message: messageOut,
      });
    }
    for (const uid of participants) {
      this.gateway.emitToUser(uid, "conversation:updated", {
        conversationId,
        lastMessageAt: created.createdAt,
        lastMessagePreview: this.previewOf(created),
      });
    }

    await this.notifyRecipient(conversation, messageOut, actor);

    await this.audit.log({
      userId: user.id,
      action: "CHAT_MESSAGE_SEND",
      entity: "Conversation",
      entityId: conversationId,
      metadata: { messageId: created.id, type },
    });

    return messageOut;
  }

  /**
   * Receipt "đã nhận": nếu thiết bị người nhận đang online (socket mở),
   * đánh dấu tin đã tới máy họ và báo cho người gửi.
   */
  private async markDeliveredIfOnline(
    message: MessageRow,
    senderUserId: string,
    recipientUserId: string | null | undefined,
  ): Promise<MessageRow> {
    if (!recipientUserId || !this.gateway.isOnline(recipientUserId))
      return message;
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: { deliveredAt: new Date() },
      include: messageInclude,
    });
    this.gateway.emitToUser(senderUserId, "messages:delivered", {
      conversationIds: [message.conversationId],
    });
    return updated;
  }

  private async notifyRecipient(
    conversation: {
      id: string;
      trainer: { userId: string };
      trainerId: string;
      member: { userId: string | null; fullName: string };
      memberId: string;
    },
    message: MessageRow,
    actor: ChatActor,
  ): Promise<void> {
    if (actor.kind === "TRAINER") {
      if (!conversation.member.userId) return;
      await this.notifications.create({
        userId: conversation.member.userId,
        type: "CHAT",
        title: "Tin nhắn mới từ huấn luyện viên",
        content: this.previewOf(message),
        link: "/member/messages",
        referenceType: "Message",
        referenceId: message.id,
      });
      return;
    }

    await this.notifications.create({
      userId: conversation.trainer.userId,
      type: "CHAT",
      title: "Tin nhắn mới từ hội viên",
      content: `${conversation.member.fullName}: ${this.previewOf(message)}`,
      link: "/trainer/messages",
      referenceType: "Message",
      referenceId: message.id,
    });
  }

  async markRead(user: { id: string; role: string }, conversationId: string) {
    const actor = await this.resolveActor(user);
    const conversation = await this.getConversationForActor(
      actor,
      conversationId,
    );

    // Đã xem thì chắc chắn đã nhận — điền deliveredAt cho các tin chưa có trong cùng lượt cập nhật
    const now = new Date();
    const result = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, isRead: false },
      data: { isRead: true, readAt: now, deliveredAt: now },
    });

    if (result.count > 0) {
      // Cả các tin đã read trước đó nhưng chưa từng delivered (dữ liệu cũ) — điền cho đủ
      const otherUserId =
        actor.kind === "TRAINER"
          ? conversation.member.userId
          : conversation.trainer.userId;
      const deliveredBackfill = await this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: user.id },
          deliveredAt: null,
        },
        data: { deliveredAt: now },
      });
      if (deliveredBackfill.count > 0) {
        this.gateway.emitToUser(otherUserId, "messages:delivered", {
          conversationIds: [conversationId],
        });
      }
      this.gateway.emitToUser(otherUserId, "messages:read", {
        conversationId,
        readerId: user.id,
        readerRole: actor.kind,
        count: result.count,
      });
    }

    return { conversationId, read: result.count };
  }

  /**
   * Thu hồi một tin nhắn của chính mình: xoá vĩnh viễn nội dung và ảnh đính kèm,
   * đánh dấu `recalledAt` để giao diện hiển thị placeholder.
   * Không gửi thông báo mới; hai bên nhận sự kiện socket `message:recalled` để tải lại.
   */
  async recallMessage(
    user: { id: string; role: string },
    conversationId: string,
    messageId: string,
  ) {
    const actor = await this.resolveActor(user);
    const conversation = await this.getConversationForActor(
      actor,
      conversationId,
    );

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
    if (!message || message.conversationId !== conversation.id) {
      throw new NotFoundException("Không tìm thấy tin nhắn.");
    }
    if (message.senderId !== user.id) {
      throw new ForbiddenException(
        "Bạn chỉ có thể thu hồi tin nhắn của chính mình.",
      );
    }

    // Gọi lặp lại thì trả về trạng thái đã thu hồi luôn (idempotent).
    if (message.recalledAt) {
      return { ...message, attachments: [], mealPlan: null };
    }

    const recalledAt = new Date();
    await this.prisma.$transaction([
      this.prisma.message.update({
        where: { id: message.id },
        data: { recalledAt, content: null },
      }),
      this.prisma.messageAttachment.deleteMany({
        where: { messageId: message.id },
      }),
    ]);

    // Cập nhật preview của hội thoại theo tin nhắn mới nhất (sau khi thu hồi)
    const latest = await this.prisma.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      select: { type: true, content: true, recalledAt: true, createdAt: true },
    });
    const preview = latest ? this.previewOf(latest) : null;
    const lastMessageAt = latest?.createdAt ?? null;
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt, lastMessagePreview: preview },
    });

    const participants = [
      conversation.trainer.userId,
      conversation.member.userId ?? conversation.trainer.userId,
    ];
    const payload = {
      conversationId: conversation.id,
      messageId: message.id,
      recalledAt: recalledAt.toISOString(),
    };
    for (const uid of participants) {
      this.gateway.emitToUser(uid, "message:recalled", payload);
      this.gateway.emitToUser(uid, "conversation:updated", {
        conversationId: conversation.id,
        lastMessageAt,
        lastMessagePreview: preview,
      });
    }

    await this.audit.log({
      userId: user.id,
      action: "CHAT_MESSAGE_RECALL",
      entity: "Conversation",
      entityId: conversation.id,
      metadata: { messageId: message.id, type: message.type },
    });

    // Không trả attachments/mealPlan về cho người gọi — chúng đã bị xoá/ẩn.
    return {
      ...message,
      recalledAt,
      content: null,
      attachments: [],
      mealPlan: null,
    };
  }

  /**
   * Gửi một tin nhắn thực đơn vào cuộc trò chuyện HLV ↔ hội viên.
   * Dùng bởi MealPlansService khi HLV bấm "Gửi cho hội viên".
   */
  async sendMealPlanMessage(params: {
    trainerUserId: string;
    memberId: string;
    mealPlanId: string;
    title: string;
    preview: string;
  }) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId: params.trainerUserId },
      select: { id: true },
    });
    if (!trainer)
      throw new ForbiddenException("Tài khoản chưa gắn hồ sơ huấn luyện viên.");

    const conversation = await this.ensureConversation(
      trainer.id,
      params.memberId,
    );
    const actor: ChatActor = {
      kind: "TRAINER",
      userId: params.trainerUserId,
      trainerId: trainer.id,
    };

    const created = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: params.trainerUserId,
        type: MessageType.MEAL_PLAN,
        content: params.title,
        mealPlanId: params.mealPlanId,
      },
      include: messageInclude,
    });

    const mealPlanMember = await this.prisma.member.findUnique({
      where: { id: params.memberId },
      select: { userId: true },
    });
    const messageOut = await this.markDeliveredIfOnline(
      created,
      params.trainerUserId,
      mealPlanMember?.userId,
    );

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: created.createdAt,
        lastMessagePreview: params.preview,
      },
    });

    const detailed = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: {
        trainer: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        member: {
          select: { id: true, userId: true, fullName: true, avatarUrl: true },
        },
      },
    });

    for (const uid of [detailed.trainer.userId, detailed.member.userId]) {
      this.gateway.emitToUser(uid, "message:new", {
        conversationId: conversation.id,
        message: messageOut,
      });
      this.gateway.emitToUser(uid, "conversation:updated", {
        conversationId: conversation.id,
        lastMessageAt: created.createdAt,
        lastMessagePreview: params.preview,
      });
    }

    await this.notifyRecipient(detailed, messageOut, actor);
    return messageOut;
  }

  /**
   * Gửi tin nhắn bài tập (TEXT, kèm đầy đủ danh sách bài tập) vào cuộc trò chuyện HLV ↔ hội viên.
   * Dùng bởi ProgramsService khi PT bấm "Gửi cho hội viên".
   * Chỉ chạy khi giữa HLV và hội viên còn phân công ACTIVE (assertAssignment trong ensureConversation).
   */
  async sendProgramMessage(params: {
    trainerUserId: string;
    memberId: string;
    programId: string;
    content: string;
  }) {
    const trainer = await this.prisma.trainer.findUnique({
      where: { userId: params.trainerUserId },
      select: { id: true },
    });
    if (!trainer)
      throw new ForbiddenException("Tài khoản chưa gắn hồ sơ huấn luyện viên.");

    const conversation = await this.ensureConversation(
      trainer.id,
      params.memberId,
    );
    const actor: ChatActor = {
      kind: "TRAINER",
      userId: params.trainerUserId,
      trainerId: trainer.id,
    };

    const created = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: params.trainerUserId,
        type: MessageType.TEXT,
        content: params.content,
      },
      include: messageInclude,
    });

    const programMember = await this.prisma.member.findUnique({
      where: { id: params.memberId },
      select: { userId: true },
    });
    const messageOut = await this.markDeliveredIfOnline(
      created,
      params.trainerUserId,
      programMember?.userId,
    );

    const preview = this.previewOf(created);
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: created.createdAt, lastMessagePreview: preview },
    });

    const detailed = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: {
        trainer: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, avatarUrl: true } },
          },
        },
        member: {
          select: { id: true, userId: true, fullName: true, avatarUrl: true },
        },
      },
    });

    for (const uid of [detailed.trainer.userId, detailed.member.userId]) {
      this.gateway.emitToUser(uid, "message:new", {
        conversationId: conversation.id,
        message: messageOut,
      });
      this.gateway.emitToUser(uid, "conversation:updated", {
        conversationId: conversation.id,
        lastMessageAt: created.createdAt,
        lastMessagePreview: preview,
      });
    }

    await this.notifyRecipient(detailed, messageOut, actor);
    return messageOut;
  }
}
