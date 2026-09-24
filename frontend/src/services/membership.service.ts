import apiClient from '@/lib/axios';
import type { Membership } from './types';

export const membershipApi = {
  getMyMemberships: async (): Promise<{ current: Membership | null; history: Membership[]; memberId?: string }> => {
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
};