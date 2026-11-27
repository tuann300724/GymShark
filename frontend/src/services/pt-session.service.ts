import apiClient from '@/lib/axios';

/** OFFERED → (hội viên chấp nhận) AWAITING_PAYMENT → (admin xác nhận) PAID */
export type PtSessionStatus = 'OFFERED' | 'AWAITING_PAYMENT' | 'PAID' | 'DECLINED' | 'CANCELLED';
export type PtPayoutStatus = 'UNPAID' | 'PAID_OUT';

/** Dạng gọn đi kèm tin nhắn chat (thẻ đề nghị buổi tập) */
export interface PtSessionCard {
  id: string;
  title: string;
  note?: string | null;
  startTime: string;
  endTime: string;
  price: string | number;
  status: PtSessionStatus;
  declineReason?: string | null;
  paymentId?: string | null;
}

interface PersonLite {
  id: string;
  code?: string;
  fullName: string;
  phone?: string;
}

export interface PtSession extends PtSessionCard {
  trainerId: string;
  memberId: string;
  commissionRate: string | number;
  platformFee: string | number;
  trainerEarning: string | number;
  payoutStatus: PtPayoutStatus;
  payoutAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  member?: PersonLite;
  trainer?: { id: string; userId: string; user: { fullName: string; avatarUrl?: string | null } };
}

export interface PtTrainerPayoutRow {
  trainerId: string;
  fullName: string;
  avatarUrl: string | null;
  commissionRate: number;
  sessions: number;
  gross: number;
  platformFee: number;
  trainerEarning: number;
  /** Đã thanh toán + đã diễn ra + chưa chi trả */
  payable: number;
  payableSessions: number;
  /** Đã thanh toán nhưng chưa diễn ra */
  upcomingEarning: number;
  paidOut: number;
}

export const ptSessionApi = {
  /** PT gửi đề nghị buổi tập cho hội viên đã nhắn tin */
  create: async (payload: {
    memberId: string;
    title: string;
    startTime: string;
    durationMinutes: number;
    price: number;
    note?: string;
  }) => {
    const res = await apiClient.post<{ message: string; session: PtSession }>(
      '/pt-sessions',
      payload,
    );
    return res.data;
  },

  cancel: async (id: string) => {
    const res = await apiClient.post<{ message: string }>(`/pt-sessions/${id}/cancel`);
    return res.data;
  },

  accept: async (id: string, paymentMethod: 'BANK_TRANSFER' | 'CASH' = 'BANK_TRANSFER') => {
    const res = await apiClient.post<{
      message: string;
      payment: { id: string; code: string; amount: number };
    }>(`/pt-sessions/${id}/accept`, { paymentMethod });
    return res.data;
  },

  decline: async (id: string, reason?: string) => {
    const res = await apiClient.post<{ message: string }>(`/pt-sessions/${id}/decline`, {
      reason,
    });
    return res.data;
  },

  /** PT: danh sách buổi + thu nhập sau chiết khấu */
  trainerMine: async () => {
    const res = await apiClient.get<{
      commissionRate: number;
      summary: {
        paidSessions: number;
        grossRevenue: number;
        totalEarning: number;
        pendingPayout: number;
        paidOut: number;
      };
      data: PtSession[];
    }>('/pt-sessions/trainer/me');
    return res.data;
  },

  /** Admin: buổi PT đặt qua hệ thống + tổng hợp chi trả theo PT */
  adminList: async (params?: { status?: PtSessionStatus; payoutStatus?: PtPayoutStatus }) => {
    const res = await apiClient.get<{
      data: PtSession[];
      trainers: PtTrainerPayoutRow[];
      totals: {
        gross: number;
        platformFee: number;
        trainerEarning: number;
        payable: number;
        paidOut: number;
      };
    }>('/pt-sessions', { params });
    return res.data;
  },

  payout: async (trainerId: string) => {
    const res = await apiClient.post<{ message: string; sessions: number; amount: number }>(
      '/pt-sessions/payout',
      { trainerId },
    );
    return res.data;
  },
};

export const PT_SESSION_STATUS_META: Record<
  PtSessionStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'info' }
> = {
  OFFERED: { label: 'Chờ hội viên xác nhận', variant: 'info' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', variant: 'warning' },
  PAID: { label: 'Đã thanh toán · đã lên lịch', variant: 'success' },
  DECLINED: { label: 'Hội viên từ chối', variant: 'destructive' },
  CANCELLED: { label: 'Đã huỷ', variant: 'default' },
};
