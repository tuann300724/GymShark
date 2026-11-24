import apiClient from '@/lib/axios';
import type {
  PartnerCommissionDetail,
  PartnerCommissionSummary,
  PartnerDetail,
  PartnerRegisterResponse,
  PartnerSummary,
} from './types';

export interface PartnerRegisterPayload {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  taxCode?: string;
  phone?: string;
  address?: string;
}

export interface PartnerListParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PartnerBranchInput {
  name: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface PartnerBranchRecord extends PartnerBranchInput {
  id: string;
  partnerId: string;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const partnerApi = {
  /** Đăng ký đối tác (public) — tạo tài khoản PARTNER + hồ sơ chờ duyệt. */
  register: async (payload: PartnerRegisterPayload): Promise<PartnerRegisterResponse> => {
    const res = await apiClient.post<PartnerRegisterResponse>('/auth/partner-register', payload);
    return res.data;
  },

  /** Hoa hồng của chính đối tác — chỉ số liệu tổng hợp, không có dữ liệu hội viên. */
  getMyCommission: async (): Promise<PartnerCommissionSummary> => {
    const res = await apiClient.get<PartnerCommissionSummary>('/partners/me/commission');
    return res.data;
  },

  getMyBranches: async (): Promise<PartnerBranchRecord[]> => {
    const res = await apiClient.get<PartnerBranchRecord[]>('/partners/me/branches');
    return res.data;
  },

  createMyBranch: async (payload: PartnerBranchInput): Promise<PartnerBranchRecord> => {
    const res = await apiClient.post<PartnerBranchRecord>('/partners/me/branches', payload);
    return res.data;
  },

  updateMyBranch: async (id: string, payload: PartnerBranchInput): Promise<PartnerBranchRecord> => {
    const res = await apiClient.patch<PartnerBranchRecord>(`/partners/me/branches/${id}`, payload);
    return res.data;
  },

  deleteMyBranch: async (id: string): Promise<void> => {
    await apiClient.delete(`/partners/me/branches/${id}`);
  },

  // ---------- Khu vực Admin ----------
  adminList: async (params: PartnerListParams) => {
    // Backend dùng forbidNonWhitelisted + IsEnum: bỏ param rỗng để tránh 400.
    const cleanParams: Record<string, string | number> = {};
    if (params.search) cleanParams.search = params.search;
    if (params.status) cleanParams.status = params.status;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
    const res = await apiClient.get<{
      data: PartnerSummary[];
      total: number;
      page: number;
      limit: number;
    }>('/admin/partners', { params: cleanParams });
    return res.data;
  },

  adminDetail: async (id: string): Promise<PartnerDetail> => {
    const res = await apiClient.get<PartnerDetail>(`/admin/partners/${id}`);
    return res.data;
  },

  adminDecision: async (
    id: string,
    action: 'approve' | 'reject' | 'suspend',
    note?: string,
  ): Promise<PartnerDetail> => {
    const res = await apiClient.post<PartnerDetail>(`/admin/partners/${id}/${action}`, {
      note: note || undefined,
    });
    return res.data;
  },

  adminCommission: async (id: string): Promise<PartnerCommissionDetail> => {
    const res = await apiClient.get<PartnerCommissionDetail>(`/admin/partners/${id}/commission`);
    return res.data;
  },

  adminUpdateCommission: async (id: string, percent: number): Promise<PartnerDetail> => {
    const res = await apiClient.patch<PartnerDetail>(`/admin/partners/${id}/commission`, {
      commissionRate: percent,
    });
    return res.data;
  },

  adminAssignPayment: async (id: string, paymentCode: string) => {
    const res = await apiClient.post(`/admin/partners/${id}/payments`, { paymentCode });
    return res.data;
  },

  adminUnassignPayment: async (id: string, paymentId: string) => {
    const res = await apiClient.delete(`/admin/partners/${id}/payments/${paymentId}`);
    return res.data;
  },
};
