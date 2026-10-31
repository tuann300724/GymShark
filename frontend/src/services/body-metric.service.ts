import apiClient from '@/lib/axios';
import type { BodyMetric } from './types';

export interface BodyMetricPayload {
  weightKg?: number;
  bodyFatPercent?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  note?: string;
  recordedAt?: string;
}

/** API số đo cơ thể (BodyMetric) — hội viên tự ghi, tự xem biểu đồ */
export const bodyMetricApi = {
  /** Lịch sử số đo của tôi */
  listMine: async (limit = 120): Promise<{ data: BodyMetric[]; total: number }> => {
    const res = await apiClient.get('/body-metrics/me', { params: { limit } });
    return res.data;
  },

  /** Ghi số đo mới (ít nhất 1 chỉ số) */
  create: async (payload: BodyMetricPayload): Promise<{ metric: BodyMetric }> => {
    const res = await apiClient.post('/body-metrics', payload);
    return res.data;
  },

  /** Xóa 1 bản ghi số đo của mình */
  remove: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/body-metrics/${id}`);
    return res.data;
  },
};
