import apiClient from '@/lib/axios';
import type { MemberCheckIn } from './types';

export const checkinApi = {
  getMyCheckins: async (
    page = 1,
    limit = 10,
  ): Promise<{
    data: MemberCheckIn[];
    total: number;
    page: number;
    limit: number;
    stats: { total: number; month: number; week: number };
  }> => {
    const res = await apiClient.get('/member/checkins', { params: { page, limit } });
    return res.data;
  },
};
