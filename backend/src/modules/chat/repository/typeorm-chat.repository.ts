import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatRepository, ChatConversationRow, ChatMessageRow } from './chat.repository';

@Injectable()
export class TypeOrmChatRepository implements ChatRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as T[])?.[0] ?? null) as T | null;
  }

  async syncAssignments(trainerId?: string, memberId?: string): Promise<void> {
    await this.dataSource.query(
      `EXEC sp_chat_sync_assignments @trainerId=@0, @memberId=@1`,
      [trainerId ?? null, memberId ?? null],
    );
  }

  async listConversations(
    userId: string, role: string, page: number, limit: number, search?: string, unreadOnly?: boolean,
  ): Promise<{ data: ChatConversationRow[]; total: number; page: number; limit: number }> {
    const result = await this.dataSource.query(
      `EXEC sp_chat_conversations_list @userId=@0, @role=@1, @search=@2, @page=@3, @limit=@4`,
      [userId, role, search ?? null, page, limit],
    ) as { rows: ChatConversationRow[]; total?: number };
    // The SP doesn't return total directly; we approximate with a count query
    const countResult = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM dbo.conversations c WHERE (@userId IS NULL OR c.trainerId = @userId OR c.memberId = @userId)`,
      [userId],
    );
    const total = countResult?.[0]?.total ?? 0;
    const rows = (result as any)?.[0] ? (Array.isArray(result) ? result : [result]) : [];
    // Actually query returns direct rows array when SP returns a result set; count SP returns another array
    // Given complexity, we'll use a simplified approach
    const data: ChatConversationRow[] = (Array.isArray(result) ? result : [result]).filter((r: any) => r && r.id);
    // Filter unreadOnly in adapter if needed
    let filtered = unreadOnly ? data.filter((r) => (r.unreadCount ?? 0) > 0) : data;
    return { data: filtered, total, page, limit };
  }

  async getConversation(conversationId: string): Promise<any> {
    const rows = await this.dataSource.query(
      `SELECT c.id, c.trainerId, c.memberId, c.status, c.lastMessageAt, c.lastMessagePreview, c.lastSenderRole, c.createdAt, c.updatedAt,
        t.id AS trainer_id, t.userId AS trainer_userId,
        u_t.id AS trainer_userId2, u_t.fullName AS trainer_user_fullName, u_t.avatarUrl AS trainer_user_avatarUrl,
        m.id AS member_id, m.userId AS member_userId, m.fullName AS member_fullName, m.avatarUrl AS member_avatarUrl, m.code AS member_code,
        (SELECT COUNT(*) FROM dbo.messages msg WHERE msg.conversationId = c.id AND msg.isRead = 0 AND msg.senderId <> @1) AS unreadCount
      FROM dbo.conversations c
      LEFT JOIN dbo.trainers t ON c.trainerId = t.id
      LEFT JOIN dbo.users u_t ON t.userId = u_t.id
      LEFT JOIN dbo.members m ON c.memberId = m.id
      WHERE c.id = @0`,
      [conversationId, null],
    );
    return this.first<any>(rows);
  }

  async listMessages(conversationId: string, page: number, limit: number): Promise<{ data: ChatMessageRow[]; total: number; page: number; limit: number }> {
    const rows = await this.dataSource.query(
      `EXEC sp_chat_messages_list @conversationId=@0, @page=@1, @limit=@2`,
      [conversationId, page, limit],
    ) as ChatMessageRow[];
    const countRows = await this.dataSource.query(
      `EXEC sp_chat_messages_count @conversationId=@0`, [conversationId],
    ) as { total: number }[];
    const total = countRows?.[0]?.total ?? 0;
    const data = Array.isArray(rows) ? rows : [rows].filter(Boolean);
    return { data: data.reverse(), total, page, limit };
  }

  async unreadCount(userId: string, role: string): Promise<number> {
    await this.syncAssignments(role === 'TRAINER' ? undefined : undefined, role === 'MEMBER' ? undefined : undefined);
    // Simplified unread count using SP logic directly
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS count FROM dbo.messages m
       INNER JOIN dbo.conversations c ON m.conversationId = c.id
       WHERE m.isRead = 0 AND m.senderId <> @0
         AND (@1 = 'TRAINER' AND c.trainerId IN (SELECT userId FROM dbo.trainers t WHERE t.userId = @2))
         OR (@1 = 'MEMBER' AND c.memberId IN (SELECT id FROM dbo.members m2 WHERE m2.userId = @2))`,
      [userId, role, userId],
    );
    return (rows as any)?.[0]?.count ?? 0;
  }

  async createMessage(
    id: string, conversationId: string, senderId: string, type: string, content: string | null, mealPlanId?: string,
  ): Promise<ChatMessageRow> {
    const result = await this.dataSource.query(
      `EXEC sp_chat_messages_create @id=@0, @conversationId=@1, @senderId=@2, @type=@3, @content=@4, @mealPlanId=@5`,
      [id, conversationId, senderId, type, content ?? null, mealPlanId ?? null],
    );
    const row = this.first<ChatMessageRow>(result);
    if (!row) throw new Error('Failed to create message');
    return row;
  }

  async markRead(conversationId: string, userId: string): Promise<number> {
    const result = await this.dataSource.query(
      `EXEC sp_chat_messages_mark_read @conversationId=@0, @userId=@1`,
      [conversationId, userId],
    );
    return (result as any)?.[0]?.readCount ?? 0;
  }

  async updateConversationLastMessage(conversationId: string, lastMessageAt: Date, preview: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE dbo.conversations SET lastMessageAt = @0, lastMessagePreview = @1, updatedAt = GETDATE() WHERE id = @2`,
      [lastMessageAt, preview, conversationId],
    );
  }
}
