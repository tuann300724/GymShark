import apiClient from '@/lib/axios';
import type { Payment, PaymentDetail } from './types';

export const paymentApi = {
  getMyPayments: async (): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/member/payments');
    return res.data;
  },

  getPaymentDetail: async (id: string): Promise<PaymentDetail> => {
    const res = await apiClient.get<PaymentDetail>(`/member/payments/${id}`);
    return res.data;
  },
};