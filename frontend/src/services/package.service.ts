import apiClient from '@/lib/axios';
import type { Branch, MembershipPackage, PublicSchedule, PublicTrainer } from './types';

/** API công khai (public website) - không cần đăng nhập */
export const packageApi = {
  getPublicPackages: async (): Promise<MembershipPackage[]> => {
    const res = await apiClient.get<MembershipPackage[]>('/public/packages');
    return res.data;
  },
};

export const publicApi = {
  getPackages: packageApi.getPublicPackages,

  getTrainers: async (): Promise<PublicTrainer[]> => {
    const res = await apiClient.get<PublicTrainer[]>('/public/trainers');
    return res.data;
  },

  getClassSchedule: async (): Promise<PublicSchedule[]> => {
    const res = await apiClient.get<PublicSchedule[]>('/public/schedule');
    return res.data;
  },

  getBranches: async (): Promise<Branch[]> => {
    const res = await apiClient.get<Branch[]>('/public/branches');
    return res.data;
  },

  getHomeStats: async (): Promise<{
    totalMembers: number;
    totalTrainers: number;
    totalBranches: number;
  }> => {
    const res = await apiClient.get('/public/home-stats');
    return res.data;
  },
};
