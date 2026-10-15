import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';

interface WsUser {
  id: string;
  role: string;
}

/**
 * ChatGateway — kênh realtime Socket.IO.
 * - Xác thực JWT ngay khi kết nối (không tin dữ liệu client).
 * - Mỗi user vào phòng riêng `user:<id>`; server chủ động phát tin tới phòng
 *   của người nhận → không cần client tự quản lý room, giảm rủi ro lộ hội thoại.
 */
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('ChatGateway');

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractToken(client: Socket): string | null {
    const fromAuth = client.handshake.auth?.token as string | undefined;
    if (fromAuth) return fromAuth.replace(/^Bearer\s+/i, '');
    const header = client.handshake.headers?.authorization;
    if (typeof header === 'string') return header.replace(/^Bearer\s+/i, '');
    return null;
  }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) throw new Error('Thiếu token xác thực.');

      const payload = await this.jwt.verifyAsync<{ sub: string; role: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') throw new Error('Tài khoản không hợp lệ hoặc đã bị khoá.');
      if (user.role !== 'TRAINER' && user.role !== 'MEMBER') {
        throw new Error('Vai trò này không hỗ trợ trò chuyện.');
      }

      client.data.user = { id: user.id, role: user.role } satisfies WsUser;
      await client.join(`user:${user.id}`);
      client.emit('ws:ready', { userId: user.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xác thực thất bại.';
      this.logger.warn(`Từ chối kết nối WS: ${message}`);
      client.emit('ws:error', { message });
      client.disconnect(true);
    }
  }

  handleDisconnect(_client: Socket) {
    // Socket.IO tự dọn phòng khi ngắt kết nối — không cần trạng thái riêng.
  }

  /** Phát sự kiện realtime tới đúng một người dùng (mọi thiết bị của họ). */
  emitToUser(userId: string | null | undefined, event: string, payload: unknown) {
    if (!userId || !this.server) return;
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  /**
   * Chuyển tiếp trạng thái "đang nhập" tới người còn lại trong cuộc trò chuyện.
   * Kiểm tra phòng ở đây (không gọi service) để tránh vòng phụ thuộc.
   */
  @SubscribeMessage('typing')
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

    const otherUserId = isTrainer ? conversation.member.userId : conversation.trainer.userId;
    this.emitToUser(otherUserId, 'typing', {
      conversationId: body.conversationId,
      userId: user.id,
      isTyping: Boolean(body.isTyping),
    });
  }
}
