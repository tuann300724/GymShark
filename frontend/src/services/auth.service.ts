import apiClient from '@/lib/axios';
import type { LoginResponse, MemberRegisterPayload } from './types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  memberRegister: async (payload: MemberRegisterPayload) => {
    const res = await apiClient.post('/auth/member-register', payload);
    return res.data;
  },

  getProfile: async () => {
    const res = await apiClient.get('/auth/profile');
    return res.data;
  },

  clearSession: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('gym_access_token');
    localStorage.removeItem('gym_user');
  },
};

/** Lưu phiên đăng nhập vào localStorage (theo kiến trúc auth hiện tại) */
export function saveSession(accessToken: string, user: LoginResponse['user']) {
  localStorage.setItem('gym_access_token', accessToken);
  localStorage.setItem('gym_user', JSON.stringify(user));
}

export function getStoredUser(): LoginResponse['user'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('gym_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
