import apiClient from '@/lib/axios';
import type {
  AdminPaymentList,
  BankInfo,
  Payment,
  PaymentDetail,
  Invoice,
  RevenueReport,
} from './types';

export interface PaymentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
  memberId?: string;
  packageId?: string;
}

export const paymentApi = {
  // ---------- Member ----------
  getMyPayments: async (): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>('/member/payments');
    return res.data;
  },

  getPaymentDetail: async (id: string): Promise<PaymentDetail> => {
    const res = await apiClient.get<PaymentDetail>(`/member/payments/${id}`);
    return res.data;
  },

  createPaymentRequest: async (payload: {
    packageId: string;
    paymentMethod?: string;
    promotionCode?: string;
    renew?: boolean;
  }) => {
    const res = await apiClient.post('/payments/me', payload);
    return res.data;
  },

  getMyInvoices: async (): Promise<{ data: Invoice[]; total: number }> => {
    const res = await apiClient.get('/invoices/me');
    return res.data;
  },

  getMyInvoice: async (id: string): Promise<Invoice> => {
    const res = await apiClient.get(`/invoices/me/${id}`);
    return res.data;
  },

  // ---------- Admin / Staff ----------
  getPayments: async (params: PaymentListParams = {}): Promise<AdminPaymentList> => {
    const res = await apiClient.get<AdminPaymentList>('/payments', { params });
    return res.data;
  },

  getPayment: async (id: string): Promise<PaymentDetail> => {
    const res = await apiClient.get<PaymentDetail>(`/payments/${id}`);
    return res.data;
  },

  confirm: async (id: string, payload: { transactionRef?: string; note?: string } = {}) => {
    const res = await apiClient.post(`/payments/${id}/confirm`, payload);
    return res.data;
  },

  reject: async (id: string, payload: { reason?: string } = {}) => {
    const res = await apiClient.post(`/payments/${id}/reject`, payload);
    return res.data;
  },

  refund: async (id: string, payload: { reason?: string; deactivateMembership?: boolean } = {}) => {
    const res = await apiClient.post(`/payments/${id}/refund`, payload);
    return res.data;
  },

  // Back-compat
  approveLegacy: async (id: string) => {
    const res = await apiClient.patch(`/payments/${id}/approve`);
    return res.data;
  },

  cancelLegacy: async (id: string) => {
    const res = await apiClient.patch(`/payments/${id}/cancel`);
    return res.data;
  },

  getBankInfo: async (): Promise<BankInfo> => {
    const res = await apiClient.get<BankInfo>('/payments/bank-info');
    return res.data;
  },

  getInvoices: async (
    params: { page?: number; limit?: number; search?: string; status?: string } = {},
  ) => {
    const res = await apiClient.get('/invoices', { params });
    return res.data;
  },

  getRevenueReport: async (
    params: {
      from?: string;
      to?: string;
      branchId?: string;
      packageId?: string;
      method?: string;
    } = {},
  ): Promise<RevenueReport> => {
    const res = await apiClient.get<RevenueReport>('/reports/revenue', { params });
    return res.data;
  },
};
