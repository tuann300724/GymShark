import apiClient from '@/lib/axios';

/** Payload tạo hội viên mới tại quầy (POST /members) */
export interface CreateMemberPayload {
  fullName: string;
  email: string;
  phone: string;
  /** Để trống = hệ thống sinh mật khẩu tạm, trả về 1 lần cho lễ tân đưa hội viên */
  password?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  address?: string;
  branchId?: string;
  emergencyContact?: string;
}

export interface CreateMemberResult {
  message: string;
  member: { id: string; code: string; fullName: string; email: string; phone: string };
  user: { id: string; email: string; fullName: string; status: string };
  /** Chỉ có mặt khi không nhập mật khẩu — chỉ trả về 1 lần duy nhất */
  tempPassword?: string;
}

/** Payload tạo thẻ tập tại quầy (POST /members/:id/memberships) */
export interface RegisterCardPayload {
  packageId: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER' | 'MOMO' | 'VNPAY';
  promotionCode?: string;
  /** true = thu tiền ngay tại quầy và kích hoạt thẻ ngay (chỉ Tiền mặt / Chuyển khoản) */
  payNow?: boolean;
  transactionRef?: string;
  notes?: string;
}

export interface RegisterCardResult {
  message: string;
  activated: boolean;
  member: { id: string; code: string; fullName: string };
  membership: { id: string; status: string; finalAmount?: string | number | null };
  payment: { id: string; code: string; amount?: string | number | null; status?: string };
}

/** API quản trị dùng tại quầy: tạo hội viên mới + tạo thẻ tập */
export const adminMemberApi = {
  create: async (payload: CreateMemberPayload): Promise<CreateMemberResult> => {
    const res = await apiClient.post<CreateMemberResult>('/members', payload);
    return res.data;
  },

  registerCard: async (
    memberId: string,
    payload: RegisterCardPayload,
  ): Promise<RegisterCardResult> => {
    const res = await apiClient.post<RegisterCardResult>(
      `/members/${memberId}/memberships`,
      payload,
    );
    return res.data;
  },
};
