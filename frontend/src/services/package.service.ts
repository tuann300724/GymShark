import apiClient from '@/lib/axios';
import type {
  MembershipPackage,
  PublicSchedule,
  PublicTrainer,
  PublicTrainerDetail,
  PublicTrainerReviewList,
  PublicPartnerBranch,
} from './types';

/** API công khai (public website) - không cần đăng nhập */
export const packageApi = {
  getPublicPackages: async (): Promise<MembershipPackage[]> => {
    const res = await apiClient.get<MembershipPackage[]>('/public/packages');
    return res.data;
  },
};

export const publicApi = {
  getPackages: packageApi.getPublicPackages,

  getBranches: async (): Promise<PublicPartnerBranch[]> => {
    const res = await apiClient.get<PublicPartnerBranch[]>('/public/branches');
    return res.data;
  },

  getTrainers: async (): Promise<PublicTrainer[]> => {
    const res = await apiClient.get<PublicTrainer[]>('/public/trainers');
    return res.data;
  },

  getTrainer: async (id: string): Promise<PublicTrainerDetail> => {
    const res = await apiClient.get<PublicTrainerDetail>(`/public/trainers/${id}`);
    return res.data;
  },

  getTrainerReviews: async (
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<PublicTrainerReviewList> => {
    const res = await apiClient.get<PublicTrainerReviewList>(`/public/trainers/${id}/reviews`, {
      params,
    });
    return res.data;
  },

  getClassSchedule: async (): Promise<PublicSchedule[]> => {
    const res = await apiClient.get<PublicSchedule[]>('/public/schedule');
    return res.data;
  },

  getHomeStats: async (): Promise<{
    totalMembers: number;
    totalTrainers: number;
  }> => {
    const res = await apiClient.get('/public/home-stats');
    return res.data;
  },
};
