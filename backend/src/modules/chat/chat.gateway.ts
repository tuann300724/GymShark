import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { PrismaService } from "../../prisma/prisma.service";

interface WsUser {
  id: string;
  role: string;
}

interface StaffShiftUpdatePayload {
  id: string;
  staffId: string;
  staffName: string;
  title: string;
  status: string;
  action: "STARTED" | "COMPLETED";
  actorId: string;
}

interface NotificationPayload {
  id?: string;
  userId?: string | null;
  memberId?: string | null;
  type?: string;
  title?: string;
  content?: string;
  link?: string | null;
  data?: unknown;
  referenceType?: string | null;
  referenceId?: string | null;
  createdAt?: Date | string;
}

/**
 * ChatGateway — kênh realtime Socket.IO toàn hệ thống.
 * - Xác thực JWT ngay khi kết nối (không tin dữ liệu client).
 * - Phòng cá nhân `user:<id>`: server phát tin nhắn / thông báo riêng tư.
 * - Phòng theo role `role:<role>`: phát tin tức theo nhóm đối tượng.
 * - Phòng vận hành `admins`: nhận thông báo mọi hoạt động nghiệp vụ tức thời.
 */
@WebSocketGateway({
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger("ChatGateway");

  /** userId → số socket đang mở (nhiều tab = nhiều socket). Dùng cho receipt "đã nhận". */
  private readonly onlineCounts = new Map<string, number>();

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** true nếu người dùng có ít nhất một socket đang kết nối. */
  isOnline(userId: string | null | undefined): boolean {
    return !!userId && this.onlineCounts.has(userId);
  }

  /**
   * Đánh dấu "đã nhận" cho mọi tin nhắn GỬI ĐẾN user đang online (chưa delivered),
   * rồi báo cho từng người gửi để họ thấy tick kép tức thì.
   */
  private async sweepDeliveredReceipts(userId: string, role: string) {
    try {
      if (role !== "TRAINER" && role !== "MEMBER") return;
      const conversationSide =
        role === "TRAINER" ? { trainer: { userId } } : { member: { userId } };
      const pending = await this.prisma.message.findMany({
        where: {
          deliveredAt: null,
          senderId: { not: userId },
          conversation: conversationSide,
        },
        select: { id: true, conversationId: true, senderId: true },
        take: 500,
      });
      if (!pending.length) return;

      await this.prisma.message.updateMany({
        where: { id: { in: pending.map((m) => m.id) } },
        data: { deliveredAt: new Date() },
      });

      const bySender = new Map<string, Set<string>>();
      for (const m of pending) {
        const set = bySender.get(m.senderId) ?? new Set<string>();
        set.add(m.conversationId);
        bySender.set(m.senderId, set);
      }
      for (const [senderId, conversationIds] of bySender) {
        this.emitToUser(senderId, "messages:delivered", {
          conversationIds: [...conversationIds],
        });
      }
    } catch (err) {
      this.logger.warn(`Không thể quét trạng thái "đã nhận": ${err}`);
    }
  }

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth.replace(/^Bearer\s+/i, "");
    const header = client.handshake.headers?.authorization;
    if (typeof header === "string") return header.replace(/^Bearer\s+/i, "");
    return null;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error("Thiếu token xác thực.");

      const payload = await this.jwt.verifyAsync<{ sub: string; role: string }>(
        token,
      );
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== "ACTIVE")
        throw new Error("Tài khoản không hợp lệ hoặc đã bị khoá.");
      if (
        !["ADMIN", "MANAGER", "STAFF", "TRAINER", "MEMBER"].includes(user.role)
      ) {
        throw new Error("Vai trò tài khoản không hợp lệ.");
      }

      client.data.user = { id: user.id, role: user.role } satisfies WsUser;
      this.onlineCounts.set(user.id, (this.onlineCounts.get(user.id) ?? 0) + 1);
      await client.join(`user:${user.id}`);
      await client.join(`role:${user.role}`);
      if (["ADMIN", "MANAGER", "STAFF"].includes(user.role)) {
        await client.join("admins");
        await client.join("staff-shift:admins");
      }
      client.emit("ws:ready", { userId: user.id });
      // Receipt "đã nhận": thiết bị của user đang online sẽ nhận mọi tin chưa delivered.
      void this.sweepDeliveredReceipts(user.id, user.role);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Xác thực thất bại.";
      this.logger.warn(`Từ chối kết nối WS: ${message}`);
      client.emit("ws:error", { message });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data?.user as WsUser | undefined;
    if (!user) return;
    const next = (this.onlineCounts.get(user.id) ?? 1) - 1;
    if (next <= 0) this.onlineCounts.delete(user.id);
    else this.onlineCounts.set(user.id, next);
  }

  /** Phát sự kiện realtime tới đúng một người dùng (mọi thiết bị của họ). */
  emitToUser(
    userId: string | null | undefined,
    event: string,
    payload: unknown,
  ) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /** Phát sự kiện tới toàn bộ quản trị viên và nhân viên vận hành (ADMIN, MANAGER, STAFF). */
  emitToAdmins(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to("admins").emit(event, payload);
  }

  /** Phát sự kiện tới tất cả người dùng thuộc một vai trò cụ thể. */
  emitToRole(role: string, event: string, payload: unknown) {
    if (!this.server) return;
    this.server.to(`role:${role}`).emit(event, payload);
  }

  /** Phát sự kiện tới toàn bộ người dùng đang trực tuyến. */
  emitToAll(event: string, payload: unknown) {
    if (!this.server) return;
    this.server.emit(event, payload);
  }

  emitStaffShiftUpdated(payload: StaffShiftUpdatePayload) {
    if (!this.server) return;
    this.server
      .to(["staff-shift:admins", `user:${payload.staffId}`])
      .emit("staff-shift:updated", payload);
  }

  // ---------------------------------------------------------------------------
  // Xử lý sự kiện từ EventEmitter2 nội bộ Backend (chạy Realtime toàn hệ thống)
  // ---------------------------------------------------------------------------

  @OnEvent("notification.created")
  async handleNotificationCreated(payload: {
    notification: NotificationPayload;
    userId?: string;
    memberId?: string;
  }) {
    if (!this.server) return;
    try {
      let targetUserId = payload.userId;
      if (!targetUserId && payload.memberId) {
        const member = await this.prisma.member.findUnique({
          where: { id: payload.memberId },
          select: { userId: true },
        });
        targetUserId = member?.userId ?? undefined;
      }
      if (targetUserId) {
        this.server
          .to(`user:${targetUserId}`)
          .emit("notification:new", payload.notification);
      }
    } catch (err) {
      this.logger.warn(`Lỗi khi phát WS notification.created: ${err}`);
    }
  }

  @OnEvent("admin.notification")
  handleAdminNotification(payload: {
    title: string;
    content: string;
    type: string;
    link?: string;
    excludeUserId?: string;
    adminIds?: string[];
    referenceType?: string;
    referenceId?: string;
    data?: unknown;
    createdAt?: Date | string;
  }) {
    if (!this.server) return;
    try {
      const dataPayload = {
        ...payload,
        createdAt: payload.createdAt || new Date(),
      };
      if (payload.excludeUserId) {
        (payload.adminIds || []).forEach((id) => {
          if (id !== payload.excludeUserId) {
            this.server.to(`user:${id}`).emit("notification:new", dataPayload);
            this.server.to(`user:${id}`).emit("admin:event", dataPayload);
          }
        });
      } else {
        this.server.to("admins").emit("notification:new", dataPayload);
        this.server.to("admins").emit("admin:event", dataPayload);
      }
    } catch (err) {
      this.logger.warn(`Lỗi khi phát WS admin.notification: ${err}`);
    }
  }

  @OnEvent("notification.broadcast")
  handleNotificationBroadcast(payload: {
    title: string;
    content: string;
    type: string;
    target: string;
    link?: string;
    data?: unknown;
  }) {
    if (!this.server) return;
    try {
      const dataPayload = {
        ...payload,
        createdAt: new Date(),
      };
      if (payload.target === "ALL") {
        this.server.emit("notification:new", dataPayload);
      } else if (["ADMIN", "MANAGERS", "STAFF"].includes(payload.target)) {
        this.server.to("admins").emit("notification:new", dataPayload);
      } else if (payload.target === "MEMBERS") {
        this.server.to("role:MEMBER").emit("notification:new", dataPayload);
      } else if (payload.target === "TRAINERS") {
        this.server.to("role:TRAINER").emit("notification:new", dataPayload);
      } else {
        this.server.emit("notification:new", dataPayload);
      }
    } catch (err) {
      this.logger.warn(`Lỗi khi phát WS notification.broadcast: ${err}`);
    }
  }

  @OnEvent("realtime.event")
  handleRealtimeEvent(payload: {
    target?: string;
    event?: string;
    data: unknown;
  }) {
    if (!this.server) return;
    try {
      const target = payload.target || "admins";
      const eventName = payload.event || "realtime:event";
      this.server.to(target).emit(eventName, payload.data);
    } catch (err) {
      this.logger.warn(`Lỗi khi phát WS realtime.event: ${err}`);
    }
  }

  @OnEvent("realtime.mutation.completed")
  handleRealtimeMutation(payload: {
    method: string;
    resource: string;
    occurredAt: string;
  }) {
    if (!this.server) return;
    this.server.emit("data:changed", payload);
  }

  /**
   * Chuyển tiếp trạng thái "đang nhập" tới người còn lại trong cuộc trò chuyện.
   * Kiểm tra phòng ở đây (không gọi service) để tránh vòng phụ thuộc.
   */
  @SubscribeMessage("typing")
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { conversationId?: string; isTyping?: boolean },
  ) {
    const user = client.data.user as WsUser | undefined;
    if (!user || !body?.conversationId) return;

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: body.conversationId },
      select: {
        trainer: { select: { userId: true } },
        member: { select: { userId: true } },
      },
    });
    if (!conversation) return;

    const isTrainer = conversation.trainer.userId === user.id;
    const isMember = conversation.member.userId === user.id;
    if (!isTrainer && !isMember) return;

    const otherUserId = isTrainer
      ? conversation.member.userId
      : conversation.trainer.userId;
    this.emitToUser(otherUserId, "typing", {
      conversationId: body.conversationId,
      userId: user.id,
      isTyping: Boolean(body.isTyping),
    });
  }
}
