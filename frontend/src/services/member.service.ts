import apiClient from '@/lib/axios';
import type { GymTier, MemberMe } from './types';

export type NearbyAreaMatch = 'WARD' | 'DISTRICT' | 'PROVINCE' | 'OTHER';

export interface NearbyGym {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  partner: { businessName: string; gymTier?: GymTier | null };
  areaMatch: NearbyAreaMatch;
  sameTier: boolean;
}

export interface NearbyGymsResult {
  hasActiveMembership: boolean;
  privateGym?: boolean;
  packageName?: string | null;
  packageTier?: GymTier | null;
  allowedTiers?: GymTier[];
  memberAddress?: string | null;
  hasArea?: boolean;
  items: NearbyGym[];
}

export const memberApi = {
  /** Phòng tập đối tác gần khu vực trong hồ sơ, dùng được với gói đang hoạt động */
  getNearbyGyms: async (): Promise<NearbyGymsResult> => {
    const res = await apiClient.get<NearbyGymsResult>('/member/nearby-gyms');
    return res.data;
  },
  getMe: async (): Promise<MemberMe> => {
    const res = await apiClient.get<MemberMe>('/member/me');
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
