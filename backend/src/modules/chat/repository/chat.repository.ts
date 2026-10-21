export interface ChatConversationRow {
  id: string;
  trainerId: string;
  memberId: string;
  status: string;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastSenderRole: string | null;
  createdAt: Date;
  updatedAt: Date;
  member_id: string;
  member_fullName: string;
  member_avatarUrl: string | null;
  member_code: string;
  member_userId: string;
  member_user_fullName: string;
  member_user_avatarUrl: string | null;
  trainer_id: string;
  trainer_userId: string;
  trainer_user_fullName: string;
  trainer_user_avatarUrl: string | null;
  unreadCount: number;
}

export interface ChatMessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  type: string;
  content: string | null;
  isRead: boolean;
  readAt: Date | null;
  mealPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
  sender_id: string;
  sender_fullName: string;
  sender_avatarUrl: string | null;
  sender_role: string;
  attachments?: any[];
  mealPlan?: any;
}

export interface ChatRepository {
  syncAssignments(trainerId?: string, memberId?: string): Promise<void>;
  listConversations(userId: string, role: string, page: number, limit: number, search?: string, unreadOnly?: boolean): Promise<{ data: ChatConversationRow[]; total: number; page: number; limit: number }>;
  getConversation(conversationId: string): Promise<any>;
  listMessages(conversationId: string, page: number, limit: number): Promise<{ data: ChatMessageRow[]; total: number; page: number; limit: number }>;
  unreadCount(userId: string, role: string): Promise<number>;
  createMessage(id: string, conversationId: string, senderId: string, type: string, content: string | null, mealPlanId?: string): Promise<ChatMessageRow>;
  markRead(conversationId: string, userId: string): Promise<number>;
  updateConversationLastMessage(conversationId: string, lastMessageAt: Date, preview: string): Promise<void>;
}
