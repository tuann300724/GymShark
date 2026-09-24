import apiClient from '@/lib/axios';
import type { AppNotification, MemberStats } from './types';

export const notificationApi = {
  getMyNotifications: async (): Promise<{ data: AppNotification[]; unreadCount: number }> => {
    const res = await apiClient.get('/member/notifications');
    return res.data;
  },

  markRead: async (id: string) => {
    const res = await apiClient.patch(`/member/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    const res = await apiClient.patch('/member/notifications/read-all');
    return res.data;
  },
};

export const statsApi = {
  getMemberStats: async (): Promise<MemberStats> => {
    const res = await apiClient.get<MemberStats>('/member/stats');
    return res.data;
  },
};