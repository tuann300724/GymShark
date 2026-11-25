import apiClient from '@/lib/axios';
import type { MyTrainerReview, PublicTrainerReview } from './types';

/** Đánh giá HLV — các thao tác ghi bắt buộc có tài khoản MEMBER. */
export const trainerReviewApi = {
  mine: async (trainerId: string): Promise<MyTrainerReview> => {
    const res = await apiClient.get<MyTrainerReview>(`/trainer-reviews/me/${trainerId}`);
    return res.data;
  },

  create: async (payload: {
    trainerId: string;
    rating: number;
    comment?: string;
  }): Promise<{ message: string; review: PublicTrainerReview }> => {
    const res = await apiClient.post('/trainer-reviews', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: { rating?: number; comment?: string },
  ): Promise<{ message: string; review: PublicTrainerReview }> => {
    const res = await apiClient.patch(`/trainer-reviews/${id}`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/trainer-reviews/${id}`);
    return res.data;
  },
};
