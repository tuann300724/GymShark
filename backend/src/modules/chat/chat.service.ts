import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MessageType } from '../../common/constants/db-enums';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from './chat.gateway';
import {
  ConversationQueryDto,
  MessageQueryDto,
  SendMessageDto,
  StartConversationDto,
} from './dto/chat.dto';

export type ChatActor =
  | { kind: 'TRAINER'; userId: string; trainerId: string }
  | { kind: 'MEMBER'; userId: string; memberId: string };

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
        orderBy: { orderIndex: 'asc' as const },
        include: { items: { orderBy: { orderIndex: 'asc' as const } } },
      },
    },
  },
} satisfies Prisma.MessageInclude;

type ConversationRow = Prisma.ConversationGetPayload<{ include: typeof conversationInclude }> & {
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
    if (user.role === 'TRAINER') {
      const trainer = await this.prisma.trainer.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!trainer) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ huấn luyện viên.');
      return { kind: 'TRAINER', userId: user.id, trainerId: trainer.id };
    }

    if (user.role === 'MEMBER') {
      const member = await this.prisma.member.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!member) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ hội viên.');
      return { kind: 'MEMBER', userId: user.id, memberId: member.id };
    }

    throw new ForbiddenException('Chỉ huấn luyện viên và hội viên sử dụng được khu vực trò chuyện.');
  }

  /** Chỉ cho phép khi còn phân công TrainerMember ACTIVE giữa HLV và hội viên. */
  private async assertAssignment(trainerId: string, memberId: string) {
    const assignment = await this.prisma.trainerMember.findFirst({
      where: { trainerId, memberId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!assignment) {
      throw new ForbiddenException(
        'Bạn chỉ có thể trò chuyện với hội viên đang được phân công phụ trách.',
      );
    }
    return assignment;
  }

  // ---------------------------------------------------------------------------
  // Đồng bộ cuộc trò chuyện theo phân công hiện tại
  // ---------------------------------------------------------------------------

  private async syncTrainerConversations(trainerId: string) {
    const assignments = await this.prisma.trainerMember.findMany({
      where: { trainerId, status: 'ACTIVE' },
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
      where: { memberId, status: 'ACTIVE' },
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

  private async ensureConversation(trainerId: string, memberId: string) {
    await this.assertAssignment(trainerId, memberId);
    return this.prisma.conversation.upsert({
      where: { trainerId_memberId: { trainerId, memberId } },
      create: { trainerId, memberId },
      update: {},
    });
  }

  // ---------------------------------------------------------------------------
  // Truy vấn
  // ---------------------------------------------------------------------------

  private mapConversation(conversation: ConversationRow, actor: ChatActor, myUserId: string) {
    const isTrainer = actor.kind === 'TRAINER';
    const partnerName = isTrainer ? conversation.member.fullName : conversation.trainer.user.fullName;
    const partnerAvatar = isTrainer
      ? conversation.member.avatarUrl ?? conversation.member.user?.avatarUrl ?? null
      : conversation.trainer.user.avatarUrl;

    return {
      id: conversation.id,
      partner: {
        type: isTrainer ? 'MEMBER' : 'TRAINER',
        id: isTrainer ? conversation.member.id : conversation.trainer.id,
        userId: isTrainer ? conversation.member.user?.id ?? null : conversation.trainer.user.id,
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

  async listConversations(user: { id: string; role: string }, query: ConversationQueryDto) {
    const actor = await this.resolveActor(user);

    if (actor.kind === 'TRAINER') await this.syncTrainerConversations(actor.trainerId);
    else await this.syncMemberConversations(actor.memberId);

    const where: Prisma.ConversationWhereInput =
      actor.kind === 'TRAINER' ? { trainerId: actor.trainerId } : { memberId: actor.memberId };

    if (actor.kind === 'TRAINER' && query.search) {
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
              messages: { where: { isRead: false, senderId: { not: user.id } } },
            },
          },
        },
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    let data = rows.map((row) => this.mapConversation(row as ConversationRow, actor, user.id));
    if (query.unreadOnly) data = data.filter((c) => c.unreadCount > 0);

    return { data, total, page, limit };
  }

  private async getConversationForActor(actor: ChatActor, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        trainer: { select: { id: true, userId: true, user: { select: { fullName: true, avatarUrl: true } } } },
        member: { select: { id: true, userId: true, fullName: true, avatarUrl: true } },
      },
    });

    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    if (actor.kind === 'TRAINER' && conversation.trainerId !== actor.trainerId) {
      throw new ForbiddenException('Bạn không có quyền truy cập cuộc trò chuyện này.');
    }
    if (actor.kind === 'MEMBER' && conversation.memberId !== actor.memberId) {
      throw new ForbiddenException('Bạn không có quyền truy cập cuộc trò chuyện này.');
    }
    return conversation;
  }

  async listMessages(
    user: { id: string; role: string },
    conversationId: string,
    query: MessageQueryDto,
  ) {
    const actor = await this.resolveActor(user);
    await this.getConversationForActor(actor, conversationId);

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.message.findMany({
        where: { conversationId },
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return { data: rows.reverse(), total, page, limit };
  }

  async unreadCount(user: { id: string; role: string }) {
    const actor = await this.resolveActor(user);
    await (actor.kind === 'TRAINER'
      ? this.syncTrainerConversations(actor.trainerId)
      : this.syncMemberConversations(actor.memberId));

    const where: Prisma.MessageWhereInput = {
      isRead: false,
      senderId: { not: user.id },
      conversation:
        actor.kind === 'TRAINER' ? { trainerId: actor.trainerId } : { memberId: actor.memberId },
    };

    const count = await this.prisma.message.count({ where });
    return { count };
  }

  // ---------------------------------------------------------------------------
  // Ghi dữ liệu
  // ---------------------------------------------------------------------------

  async startConversation(user: { id: string; role: string }, dto: StartConversationDto) {
    const actor = await this.resolveActor(user);
    if (actor.kind !== 'TRAINER') {
      throw new ForbiddenException('Chỉ huấn luyện viên được chủ động mở cuộc trò chuyện.');
    }

    const conversation = await this.ensureConversation(actor.trainerId, dto.memberId);

    const row = await this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        ...conversationInclude,
        _count: { select: { messages: { where: { isRead: false, senderId: { not: user.id } } } } },
      },
    });

    return this.mapConversation(row as ConversationRow, actor, user.id);
  }

  private previewOf(message: { type: string; content: string | null }): string {
    const text = (message.content ?? '').trim();
    if (text) return text.length > 140 ? `${text.slice(0, 140)}…` : text;
    if (message.type === 'IMAGE') return '[Hình ảnh]';
    if (message.type === 'MEAL_PLAN') return '[Thực đơn dinh dưỡng]';
    return 'Tin nhắn';
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
    const conversation = await this.getConversationForActor(actor, conversationId);

    await this.assertAssignment(conversation.trainerId, conversation.memberId);

    const attachments = dto.attachments ?? [];
    const explicitType = dto.type;
    if (explicitType === MessageType.MEAL_PLAN || explicitType === MessageType.SYSTEM) {
      throw new BadRequestException('Loại tin nhắn này không gửi trực tiếp qua API.');
    }

    const type: MessageType = explicitType ?? (attachments.length ? MessageType.IMAGE : MessageType.TEXT);
    const content = dto.content?.trim() ?? '';

    if (type === MessageType.TEXT && !content) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống.');
    }
    if (type === MessageType.IMAGE && attachments.length === 0) {
      throw new BadRequestException('Tin nhắn hình ảnh cần có ít nhất một tệp.');
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
                kind: a.kind ?? 'IMAGE',
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
      data: { lastMessageAt: created.createdAt, lastMessagePreview: this.previewOf(created) },
    });

    const participants = [
      conversation.trainer.userId,
      conversation.member.userId ?? conversation.trainer.userId,
    ];
    for (const uid of participants) {
      this.gateway.emitToUser(uid, 'message:new', { conversationId, message: created });
    }
    for (const uid of participants) {
      this.gateway.emitToUser(uid, 'conversation:updated', {
        conversationId,
        lastMessageAt: created.createdAt,
        lastMessagePreview: this.previewOf(created),
      });
    }

    await this.notifyRecipient(conversation, created, actor);

    await this.audit.log({
      userId: user.id,
      action: 'CHAT_MESSAGE_SEND',
      entity: 'Conversation',
      entityId: conversationId,
      metadata: { messageId: created.id, type },
    });

    return created;
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
    if (actor.kind === 'TRAINER') {
      if (!conversation.member.userId) return;
      await this.notifications.create({
        userId: conversation.member.userId,
        type: 'CHAT',
        title: 'Tin nhắn mới từ huấn luyện viên',
        content: this.previewOf(message),
        link: '/member/messages',
        referenceType: 'Message',
        referenceId: message.id,
      });
      return;
    }

    await this.notifications.create({
      userId: conversation.trainer.userId,
      type: 'CHAT',
      title: 'Tin nhắn mới từ hội viên',
      content: `${conversation.member.fullName}: ${this.previewOf(message)}`,
      link: '/trainer/messages',
      referenceType: 'Message',
      referenceId: message.id,
    });
  }

  async markRead(user: { id: string; role: string }, conversationId: string) {
    const actor = await this.resolveActor(user);
    const conversation = await this.getConversationForActor(actor, conversationId);

    const result = await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: user.id }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    if (result.count > 0) {
      const otherUserId =
        actor.kind === 'TRAINER' ? conversation.member.userId : conversation.trainer.userId;
      this.gateway.emitToUser(otherUserId, 'messages:read', {
        conversationId,
        readerId: user.id,
        readerRole: actor.kind,
        count: result.count,
      });
    }

    return { conversationId, read: result.count };
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
    if (!trainer) throw new ForbiddenException('Tài khoản chưa gắn hồ sơ huấn luyện viên.');

    const conversation = await this.ensureConversation(trainer.id, params.memberId);
    const actor: ChatActor = { kind: 'TRAINER', userId: params.trainerUserId, trainerId: trainer.id };

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

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: created.createdAt, lastMessagePreview: params.preview },
    });

    const detailed = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversation.id },
      include: {
        trainer: { select: { id: true, userId: true, user: { select: { fullName: true, avatarUrl: true } } } },
        member: { select: { id: true, userId: true, fullName: true, avatarUrl: true } },
      },
    });

    for (const uid of [detailed.trainer.userId, detailed.member.userId]) {
      this.gateway.emitToUser(uid, 'message:new', { conversationId: conversation.id, message: created });
      this.gateway.emitToUser(uid, 'conversation:updated', {
        conversationId: conversation.id,
        lastMessageAt: created.createdAt,
        lastMessagePreview: params.preview,
      });
    }

    await this.notifyRecipient(detailed, created, actor);
    return created;
  }
}
