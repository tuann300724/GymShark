import apiClient from '@/lib/axios';
import type { MemberSchedule } from './types';

export const scheduleApi = {
  getMySchedules: async (): Promise<{ data: MemberSchedule[]; upcoming: number }> => {
    const res = await apiClient.get('/member/schedules');
    return res.data;
  },
};