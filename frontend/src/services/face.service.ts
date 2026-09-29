import apiClient from '@/lib/axios';

/** Trạng thái đăng ký khuôn mặt (tự quét 1:1 hoặc do lễ tân đăng ký hộ tại quầy) */
export interface FaceStatus {
  enrolled: boolean;
  sampleCount: number;
  consentAt: string | null;
  /** Ảnh tham chiếu chụp lúc đăng ký (data URL JPEG) — null nếu chưa lưu ảnh */
  imageData: string | null;
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
   * Đăng ký (ghi đè mẫu cũ) — gửi vector embedding + ảnh tham chiếu chụp tại chỗ,
   * kèm đồng ý tường minh theo Nghị định 13/2023.
   */
  enroll: async (
    embeddings: number[][],
    imageData?: string | null,
  ): Promise<{ data: FaceStatus }> => {
    const res = await apiClient.post('/faces/enroll', {
      embeddings,
      imageData: imageData ?? undefined,
      consentGiven: true,
    });
    return res.data;
  },

  /** Rút lui đồng ý — xoá toàn bộ vector + ảnh khuôn mặt của mình */
  withdraw: async (): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete('/faces/enroll');
    return res.data;
  },

  /** Admin/Manager/Staff: xem trạng thái + ảnh đăng ký của một hội viên */
  getMemberFace: async (memberId: string): Promise<FaceMemberStatus> => {
    const res = await apiClient.get(`/faces/member/${memberId}`);
    return res.data;
  },

  /**
   * Admin/Manager/Staff: đăng ký khuôn mặt THAY hội viên tại quầy (làm thẻ).
   * Nhân viên xác nhận hội viên đã đồng ý; ảnh chụp được lưu để đối chiếu khi check-in.
   */
  adminEnroll: async (
    memberId: string,
    embeddings: number[][],
    imageData?: string | null,
  ): Promise<{ data: FaceStatus }> => {
    const res = await apiClient.post(`/faces/member/${memberId}/enroll`, {
      embeddings,
      imageData: imageData ?? undefined,
      consentGiven: true,
    });
    return res.data;
  },

  /** Admin/Manager: xoá đăng ký thay hội viên (khi hội viên yêu cầu) */
  adminWithdraw: async (memberId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete(`/faces/member/${memberId}`);
    return res.data;
  },
};
