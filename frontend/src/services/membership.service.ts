import apiClient from '@/lib/axios';
import type { Membership } from './types';

export const membershipApi = {
  getMyMemberships: async (): Promise<{
    current: Membership | null;
    pending: Membership | null;
    /** Gói ĐÃ gia hạn nhưng chưa tới ngày kích hoạt (ACTIVE, startDate > hôm nay) */
    upcoming: Membership | null;
    history: Membership[];
    memberId?: string;
  }> => {
    const res = await apiClient.get('/member/memberships');
    return res.data;
  },

  getCurrent: async (): Promise<{ current: Membership | null }> => {
    const res = await apiClient.get('/member/memberships/current');
    return res.data;
  },

  register: async (payload: { packageId: string; paymentMethod?: string; notes?: string }) => {
    const res = await apiClient.post('/member/memberships', payload);
    return res.data;
  },

  renew: async (payload: { packageId: string; paymentMethod?: string; notes?: string }) => {
    const res = await apiClient.post('/member/memberships/renew', payload);
    return res.data;
  },

  /** Hội viên tự hủy yêu cầu đang chờ thanh toán (Payment + Membership + Invoice → CANCELLED) */
  cancelPendingPayment: async (paymentId: string) => {
    const res = await apiClient.post(`/member/payments/${paymentId}/cancel`);
    return res.data;
  },

  /** Hội viên gửi yêu cầu hủy gói đang hoạt động — chờ admin xét duyệt (hoàn tiền nếu có) */
  createCancelRequest: async (membershipId: string, reason?: string) => {
    const res = await apiClient.post(`/memberships/${membershipId}/cancel-request`, {
      reason: reason || undefined,
    });
    return res.data as { message: string; membership: Membership };
  },

  getChangeRequests: async () => {
    const res = await apiClient.get('/membership-changes/mine');
    return res.data;
  },

  createChangeRequest: async (
    membershipId: string,
    payload: {
      type: 'CANCEL_REFUND' | 'FREEZE';
      reason?: string;
      freezeDays?: number;
    },
  ) => {
    const res = await apiClient.post(`/membership-changes/for/${membershipId}`, payload);
    return res.data;
  },

  confirmChangeRequest: async (requestId: string) => {
    const res = await apiClient.post(`/membership-changes/${requestId}/confirm`);
    return res.data;
  },

  declineChangeRequest: async (requestId: string) => {
    const res = await apiClient.post(`/membership-changes/${requestId}/decline`);
    return res.data;
  },
};
