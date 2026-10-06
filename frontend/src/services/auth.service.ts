import apiClient from '@/lib/axios';
import type {
  LoginResponse,
  MemberRegisterPayload,
  MemberRegisterVerifyPayload,
  MemberRegisterVerifyResponse,
  RegisterCodeResponse,
} from './types';

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return res.data;
  },

  /**
   * Bước 1 đăng ký hội viên — gửi mã xác minh 6 số về chính email hội viên khai báo.
   * Chưa tạo tài khoản: phải gọi `memberRegisterVerify` với mã nhận được mới đăng ký xong.
   */
  memberRegisterSendCode: async (payload: MemberRegisterPayload): Promise<RegisterCodeResponse> => {
    const res = await apiClient.post<RegisterCodeResponse>(
      '/auth/member-register/send-code',
      payload,
    );
    return res.data;
  },

  /** Bước 2 — xác minh mã, đúng + còn hạn thì backend tạo User + Member. */
  memberRegisterVerify: async (
    payload: MemberRegisterVerifyPayload,
  ): Promise<MemberRegisterVerifyResponse> => {
    const res = await apiClient.post<MemberRegisterVerifyResponse>(
      '/auth/member-register/verify',
      payload,
    );
    return res.data;
  },

  /** Gửi lại mã mới (mã cũ mất hiệu lực) — không cần nhập lại mật khẩu. */
  memberRegisterResendCode: async (email: string): Promise<RegisterCodeResponse> => {
    const res = await apiClient.post<RegisterCodeResponse>('/auth/member-register/resend-code', {
      email,
    });
    return res.data;
  },

  /** Quên mật khẩu bước 1 — gửi mã 6 số về email đã đăng ký. */
  forgotPassword: async (email: string): Promise<RegisterCodeResponse> => {
    const res = await apiClient.post<RegisterCodeResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  /** Quên mật khẩu bước 2 — nhập mã + mật khẩu mới. */
  resetPassword: async (
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', {
      email,
      code,
      newPassword,
    });
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
