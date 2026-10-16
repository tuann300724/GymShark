import apiClient from '@/lib/axios';

interface ConversationPartner {
  type: 'TRAINER' | 'MEMBER';
  id: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  code?: string | null;
}

export interface ConversationItem {
  id: string;
  partner: ConversationPartner;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  status: string;
  unreadCount: number;
  myUserId?: string;
}

export interface ConversationListResponse {
  data: ConversationItem[];
  total: number;
  page: number;
  limit: number;
}

interface MessageAttachment {
  id: string;
  dataUrl: string;
  mimeType: string | null;
  fileName: string | null;
  width: number | null;
  height: number | null;
  kind: string | null;
}

interface MessageSender {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  sender: MessageSender;
  type: 'TEXT' | 'IMAGE' | 'MEAL_PLAN' | 'SYSTEM';
  content: string | null;
  mealPlan: any | null;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageListResponse {
  data: MessageItem[];
  total: number;
  page: number;
  limit: number;
}

export const chatApi = {
  listConversations: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    unreadOnly?: boolean;
  }): Promise<ConversationListResponse> => {
    const res = await apiClient.get<ConversationListResponse>('/chat/conversations', { params });
    return res.data;
  },

  startConversation: async (memberId: string): Promise<ConversationItem> => {
    const res = await apiClient.post<ConversationItem>('/chat/conversations', { memberId });
    return res.data;
  },

  getMessages: async (
    conversationId: string,
    params?: { page?: number; limit?: number },
  ): Promise<MessageListResponse> => {
    const res = await apiClient.get<MessageListResponse>(
      `/chat/conversations/${conversationId}/messages`,
      { params },
    );
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    payload: {
      type?: 'TEXT' | 'IMAGE';
      content?: string;
      attachments?: Array<{
        dataUrl: string;
        fileName?: string;
        mimeType?: string;
        sizeBytes?: number;
        width?: number;
        height?: number;
        kind?: string;
      }>;
    },
  ): Promise<MessageItem> => {
    const res = await apiClient.post<MessageItem>(
      `/chat/conversations/${conversationId}/messages`,
      payload,
    );
    return res.data;
  },

  markRead: async (conversationId: string): Promise<{ conversationId: string; read: number }> => {
    const res = await apiClient.post<{ conversationId: string; read: number }>(
      `/chat/conversations/${conversationId}/read`,
    );
    return res.data;
  },

  unreadCount: async (): Promise<{ count: number }> => {
    const res = await apiClient.get<{ count: number }>('/chat/unread-count');
    return res.data;
  },
};
