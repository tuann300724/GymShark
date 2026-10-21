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
import { DataSource } from 'typeorm';

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
    private readonly dataSource: DataSource,
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
      const rows = await this.dataSource.query(
        `SELECT id, role, status FROM dbo.users WHERE id = @0`, [payload.sub],
      );
      const user = (rows as any[])?.[0] ?? null;

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

    const rows = await this.dataSource.query(
      `SELECT c.id, t.userId AS trainerUserId, m.userId AS memberUserId
       FROM dbo.conversations c
       LEFT JOIN dbo.trainers t ON c.trainerId = t.id
       LEFT JOIN dbo.members m ON c.memberId = m.id
       WHERE c.id = @0`,
      [body.conversationId],
    );
    const conversation = (rows as any[])?.[0] ?? null;
    if (!conversation) return;

    const isTrainer = conversation.trainerUserId === user.id;
    const isMember = conversation.memberUserId === user.id;
    if (!isTrainer && !isMember) return;

    const otherUserId = isTrainer ? conversation.memberUserId : conversation.trainerUserId;
    this.emitToUser(otherUserId, 'typing', {
      conversationId: body.conversationId,
      userId: user.id,
      isTyping: Boolean(body.isTyping),
    });
  }
}
