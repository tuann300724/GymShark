import apiClient from '@/lib/axios';
import type { MemberMe } from './types';

export const memberApi = {
  getMe: async (): Promise<MemberMe> => {
    const res = await apiClient.get<MemberMe>('/member/me');
    return res.data;
  },

  /** Mã QR cá nhân (thẻ ra vào) — token cố định nên QR không đổi giữa các lần tải */
  getMyQr: async (): Promise<{
    token: string;
    member: {
      id: string;
      code: string;
      fullName: string;
      status: string;
    };
  }> => {
    const res = await apiClient.get('/member/qr');
    return res.data;
  },

  updateMe: async (payload: {
    fullName?: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    address?: string;
    avatarUrl?: string;
    emergencyContact?: string;
  }) => {
    const res = await apiClient.patch('/member/me', payload);
    return res.data;
  },

  getMyReferral: async (): Promise<any> => {
    const res = await apiClient.get('/member/me/referral');
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.put('/member/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
