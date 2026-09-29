import apiClient from '@/lib/axios';

/** Trạng thái đăng ký khuôn mặt (tự quét 1:1 hoặc do lễ tân quản lý) */
export interface FaceStatus {
  enrolled: boolean;
  sampleCount: number;
  consentAt: string | null;
}

export interface FaceMemberStatus extends FaceStatus {
  member: { id: string; code: string; fullName: string; status: string };
}

export const faceApi = {
  /** Trạng thái đăng ký của chính mình */
  getMyStatus: async (): Promise<FaceStatus> => {
    const res = await apiClient.get('/faces/me');
    return res.data;
  },

  /**
   * Đăng ký (ghi đè mẫu cũ) — chỉ gửi vector, kèm đồng ý tường minh
   * theo Nghị định 13/2023 (không gửi ảnh gốc).
   */
  enroll: async (embeddings: number[][]): Promise<{ data: FaceStatus }> => {
    const res = await apiClient.post('/faces/enroll', { embeddings, consentGiven: true });
    return res.data;
  },

  /** Rút lui đồng ý — xoá toàn bộ vector của mình */
  withdraw: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete('/faces/enroll');
    return res.data;
  },

  /** Admin/Manager: xem trạng thái đăng ký của một hội viên */
  getMemberFace: async (memberId: string): Promise<FaceMemberStatus> => {
    const res = await apiClient.get(`/faces/member/${memberId}`);
    return res.data;
  },

  /** Admin/Manager: xoá đăng ký thay hội viên (khi hội viên yêu cầu) */
  adminWithdraw: async (memberId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/faces/member/${memberId}`);
    return res.data;
  },
};
