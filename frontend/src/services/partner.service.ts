import apiClient from '@/lib/axios';
import type {
  GymTier,
  PartnershipPlan,
  PartnershipType,
  PartnerCommissionDetail,
  PartnerCommissionSummary,
  PartnerNetworkMembers,
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

/** Khu vực ảnh cơ sở vật chất — khớp FACILITY_PHOTO_AREAS ở backend */
export type FacilityPhotoArea = 'WEIGHTS' | 'CARDIO' | 'LOCKER' | 'RECEPTION' | 'OTHER';

export interface FacilityPhotoInput {
  area: FacilityPhotoArea;
  caption?: string;
  dataUrl: string;
}

export interface FacilityPhoto extends FacilityPhotoInput {
  id: string;
  createdAt: string;
}

export interface PartnerLeadPayload {
  direction: 'OWNER' | 'COMMUNITY';
  contactName: string;
  address?: string;
  email: string;
  phone: string;
  message?: string;
  /** Bắt buộc ≥ 3 ảnh với hướng Gym Cộng đồng */
  photos?: FacilityPhotoInput[];
}

export type PartnerLeadStatus = 'NEW' | 'CONTACTED' | 'CONSULTING' | 'CONVERTED' | 'CLOSED';

export interface PartnerLeadHistoryItem {
  id: string;
  action: string;
  actorName: string;
  at: string;
  from: PartnerLeadStatus | null;
  to: PartnerLeadStatus | null;
  note: string | null;
  emailSent?: boolean | null;
  tier?: GymTier | null;
}
export interface PartnerLeadRecord {
  id: string;
  direction: 'OWNER' | 'COMMUNITY';
  contactName: string;
  address: string | null;
  email: string;
  phone: string;
  message: string | null;
  status: PartnerLeadStatus;
  notes: string | null;
  handledAt: string | null;
  /** Đánh giá cơ sở vật chất (Gym Cộng đồng) */
  assessedTier?: GymTier | null;
  assessmentNote?: string | null;
  assessedAt?: string | null;
  _count?: { photos: number };
  createdAt: string;
  updatedAt?: string;
  accountCreated: boolean;
}

export interface PartnerAccountCreationResult {
  message: string;
  partnerId: string;
  emailSent: boolean;
  temporaryPassword?: string;
}

export interface MyPartnership {
  businessName: string;
  status: string;
  partnershipType: PartnershipType | null;
  planName: string | null;
  currentPlanPrice: string | number | null;
  monthlyFee: string | number | null;
  contractStartAt: string | null;
  contractEndAt: string | null;
  commissionRate: number;
  gymTier: GymTier | null;
  tierNote: string | null;
  tierAssessedAt: string | null;
  eligiblePackages: Array<{
    id: string;
    name: string;
    type: string;
    price: string | number;
    durationDays: number;
    visitLimit: number | null;
  }>;
  totalActivePackages: number;
  lastRenewalRequest: { at: string; months: number | null } | null;
}

export interface PartnerListParams {
  search?: string;
  status?: string;
  partnershipType?: string;
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
  /** Gửi yêu cầu tư vấn hợp tác; không tạo tài khoản. */
  submitLead: async (
    payload: PartnerLeadPayload,
  ): Promise<{ message: string; emailSent: boolean }> => {
    const res = await apiClient.post<{ message: string; emailSent: boolean }>(
      '/partner-leads',
      payload,
      { timeout: 30000 },
    );
    return res.data;
  },
  adminLeadList: async (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await apiClient.get<{
      data: PartnerLeadRecord[];
      total: number;
      page: number;
      limit: number;
      counts?: Record<PartnerLeadStatus, number>;
    }>('/partner-leads/admin', {
      params: Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== undefined),
      ),
    });
    return res.data;
  },
  /** Lưu ghi chú nội bộ (trạng thái đổi qua adminTransitionLead). */
  adminUpdateLead: async (id: string, payload: { notes?: string }) => {
    const res = await apiClient.patch<PartnerLeadRecord>(`/partner-leads/admin/${id}`, payload);
    return res.data;
  },
  /** Chuyển yêu cầu sang bước tiếp theo của quy trình. */
  adminTransitionLead: async (
    id: string,
    payload: { status: PartnerLeadStatus; note?: string; notifyPartner?: boolean },
  ) => {
    const res = await apiClient.post<PartnerLeadRecord & { emailSent?: boolean }>(
      `/partner-leads/admin/${id}/transition`,
      payload,
      { timeout: 30000 },
    );
    return res.data;
  },
  adminLeadPhotos: async (id: string) => {
    const res = await apiClient.get<FacilityPhoto[]>(`/partner-leads/admin/${id}/photos`);
    return res.data;
  },
  /** Xếp hạng phòng gym cho yêu cầu Gym Cộng đồng sau khi xem ảnh / khảo sát. */
  adminAssessLead: async (id: string, payload: { tier: GymTier; note: string }) => {
    const res = await apiClient.post(`/partner-leads/admin/${id}/assessment`, payload);
    return res.data;
  },
  adminLeadHistory: async (id: string) => {
    const res = await apiClient.get<PartnerLeadHistoryItem[]>(`/partner-leads/admin/${id}/history`);
    return res.data;
  },
  adminCreatePartnerAccount: async (id: string, businessName: string, termMonths = 1) => {
    const res = await apiClient.post<PartnerAccountCreationResult>(
      `/partner-leads/admin/${id}/create-account`,
      { businessName, termMonths },
      { timeout: 30000 },
    );
    return res.data;
  },
  /** Đăng ký đối tác (public) — tạo tài khoản PARTNER + hồ sơ chờ duyệt. */
  register: async (payload: PartnerRegisterPayload): Promise<PartnerRegisterResponse> => {
    const res = await apiClient.post<PartnerRegisterResponse>('/auth/partner-register', payload);
    return res.data;
  },

  /** Hoa hồng của chính đối tác — chỉ số liệu tổng hợp, không có dữ liệu hội viên. */
  /** Hợp đồng của chính đối tác: loại gói, phí, thời hạn, hạng phòng, gói tập được vào. */
  getMyPartnership: async (): Promise<MyPartnership> => {
    const res = await apiClient.get<MyPartnership>('/partners/me/partnership');
    return res.data;
  },
  /** Gửi yêu cầu gia hạn hợp đồng (tối đa 1 lần/24h) — admin xác nhận thu phí rồi gia hạn. */
  requestRenewal: async (payload: { months: number; note?: string }) => {
    const res = await apiClient.post<{ message: string }>('/partners/me/renewal-request', payload);
    return res.data;
  },

  getMyCommission: async (): Promise<PartnerCommissionSummary> => {
    const res = await apiClient.get<PartnerCommissionSummary>('/partners/me/commission');
    return res.data;
  },

  /** Hội viên Gym Master (gói nền tảng) đã tập tại phòng của đối tác, 12 tháng gần nhất. */
  getMyNetworkMembers: async (): Promise<PartnerNetworkMembers> => {
    const res = await apiClient.get<PartnerNetworkMembers>('/partners/me/network-members');
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

  deleteMyBranch: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/partners/me/branches/${id}`);
    return res.data;
  },

  // ---------- Khu vực Admin ----------
  adminList: async (params: PartnerListParams) => {
    // Backend dùng forbidNonWhitelisted + IsEnum: bỏ param rỗng để tránh 400.
    const cleanParams: Record<string, string | number> = {};
    if (params.search) cleanParams.search = params.search;
    if (params.status) cleanParams.status = params.status;
    if (params.partnershipType) cleanParams.partnershipType = params.partnershipType;
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

  /** Bảng giá 2 gói hợp tác (công khai — trang đăng ký đối tác). */
  publicPlans: async (): Promise<PartnershipPlan[]> => {
    const res = await apiClient.get<PartnershipPlan[]>('/public/partnership-plans');
    return res.data;
  },
  adminPlans: async (): Promise<PartnershipPlan[]> => {
    const res = await apiClient.get<PartnershipPlan[]>('/admin/partnership-plans');
    return res.data;
  },
  /** Sửa giá gói hợp tác (chỉ ADMIN) — áp dụng cho hợp đồng ký mới. */
  adminUpdatePlan: async (code: PartnershipType, payload: { monthlyPrice: number }) => {
    const res = await apiClient.patch<PartnershipPlan>(`/admin/partnership-plans/${code}`, payload);
    return res.data;
  },
  /** Đổi loại hợp tác / gia hạn hợp đồng đối tác. */
  adminUpdateContract: async (
    id: string,
    payload: { partnershipType?: PartnershipType; extendMonths?: number },
  ): Promise<PartnerDetail> => {
    const res = await apiClient.patch<PartnerDetail>(`/admin/partners/${id}/contract`, payload);
    return res.data;
  },

  /** Xếp hạng / đánh giá lại hạng phòng gym của đối tác (null = bỏ xếp hạng). */
  adminUpdateTier: async (
    id: string,
    payload: { gymTier: GymTier | null; note?: string },
  ): Promise<PartnerDetail> => {
    const res = await apiClient.patch<PartnerDetail>(`/admin/partners/${id}/tier`, payload);
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
