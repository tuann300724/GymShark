import apiClient from '@/lib/axios';
import type {
  Promotion,
  PromotionListResponse,
  PromotionStats,
  PromotionUsageResponse,
  PromotionValidateResult,
  PublicPromotion,
} from './types';

export type PromotionPayload = {
  code: string;
  name: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit?: number;
  perMemberLimit?: number;
  status?: 'ACTIVE' | 'INACTIVE';
};

export const promotionApi = {
  /** Danh sách mã (ADMIN/MANAGER/STAFF) + cards thống kê */
  list: async (
    params: { search?: string; status?: string; type?: string; from?: string; to?: string } = {},
  ): Promise<PromotionListResponse> => {
    const res = await apiClient.get<PromotionListResponse>('/promotions', { params });
    return res.data;
  },

  /** Cards tổng quan cho dashboard/trang list */
  stats: async (): Promise<PromotionStats> => {
    const res = await apiClient.get<PromotionStats>('/promotions/stats');
    return res.data;
  },

  detail: async (id: string): Promise<Promotion> => {
    const res = await apiClient.get<Promotion>(`/promotions/${id}`);
    return res.data;
  },

  usages: async (
    id: string,
    params: { method?: string; status?: string } = {},
  ): Promise<PromotionUsageResponse> => {
    const res = await apiClient.get<PromotionUsageResponse>(`/promotions/${id}/usages`, { params });
    return res.data;
  },

  create: async (payload: PromotionPayload): Promise<{ message: string; promotion: Promotion }> => {
    const res = await apiClient.post('/promotions', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: Partial<PromotionPayload>,
  ): Promise<{ message: string; promotion: Promotion }> => {
    const res = await apiClient.patch(`/promotions/${id}`, payload);
    return res.data;
  },

  activate: async (id: string) => {
    const res = await apiClient.post(`/promotions/${id}/activate`);
    return res.data;
  },

  deactivate: async (id: string) => {
    const res = await apiClient.post(`/promotions/${id}/deactivate`);
    return res.data;
  },

  /** Member tự kiểm tra mã trước khi đăng ký — backend tính subtotal/discount/total */
  validate: async (code: string, packageId: string): Promise<PromotionValidateResult> => {
    const res = await apiClient.post<PromotionValidateResult>('/promotions/validate', {
      code,
      packageId,
    });
    return res.data;
  },

  /** Trang gói tập công khai — danh sách mã đang hiệu lực */
  getPublic: async (): Promise<PublicPromotion[]> => {
    const res = await apiClient.get<PublicPromotion[]>('/public/promotions');
    return res.data;
  },
};
