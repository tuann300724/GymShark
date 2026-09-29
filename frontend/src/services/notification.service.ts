import apiClient from '@/lib/axios';
import type {
  MemberStats,
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from './types';

export const notificationApi = {
  /** Thông báo của tôi (mọi role) — tab=all|unread|read, lọc type */
  getMine: async (
    params: { tab?: 'all' | 'unread' | 'read'; type?: string; limit?: number } = {},
  ): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications/me', { params });
    return res.data;
  },

  /** Số chưa đọc (bell badge) — nhẹ nhất */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get<UnreadCountResponse>('/notifications/me/unread');
    return res.data;
  },

  /** Danh sách nhanh cho dropdown bell (limit nhỏ) */
  getMineMini: async (limit = 5): Promise<NotificationItem[]> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications/me', {
      params: { limit },
    });
    return res.data.data;
  },

  markRead: async (id: string): Promise<{ message: string; notification?: NotificationItem }> => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async (): Promise<{ message: string; updated: number }> => {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },

  // ---------------- Admin ----------------

  /** Danh sách toàn hệ thống (ADMIN/MANAGER) */
  findAllAdmin: async (
    params: {
      type?: string;
      unread?: string;
      role?: string;
      search?: string;
      from?: string;
      to?: string;
      limit?: number;
    } = {},
  ): Promise<NotificationListResponse> => {
    const res = await apiClient.get<NotificationListResponse>('/notifications', { params });
    return res.data;
  },

  /** Thông báo hàng loạt — target: ALL/MEMBERS/TRAINERS/STAFF/MANAGERS/SPECIFIC_BRANCH */
  announce: async (payload: {
    title: string;
    message: string;
    target: string;
    branchId?: string;
    startAt?: string;
    endAt?: string;
  }) => {
    const res = await apiClient.post('/notifications/announce', payload);
    return res.data;
  },
};

export const statsApi = {
  getMemberStats: async (): Promise<MemberStats> => {
    const res = await apiClient.get<MemberStats>('/member/stats');
    return res.data;
  },
};
