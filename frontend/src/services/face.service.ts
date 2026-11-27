import apiClient from '@/lib/axios';

/** Trạng thái duyệt ảnh: hội viên tự gửi → PENDING; lễ tân đăng ký hộ → APPROVED luôn */
export type FaceReviewStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

/** Trạng thái đăng ký khuôn mặt (tự quét 1:1 hoặc do lễ tân đăng ký hộ tại quầy) */
export interface FaceStatus {
  /** true = đã được duyệt, dùng được để check-in */
  enrolled: boolean;
  reviewStatus: FaceReviewStatus;
  reviewedAt: string | null;
  /** Lý do admin từ chối (chỉ có khi reviewStatus = REJECTED) */
  rejectReason: string | null;
  sampleCount: number;
  consentAt: string | null;
  /** Ảnh tham chiếu chụp lúc đăng ký (data URL JPEG) — null nếu chưa lưu ảnh */
  imageData: string | null;
}

export interface FaceMemberStatus extends FaceStatus {
  member: { id: string; code: string; fullName: string; status: string };
}

export interface FacePendingReview {
  memberId: string;
  member: {
    id: string;
    code: string;
    fullName: string;
    email: string | null;
    phone: string;
    status: string;
  };
  imageData: string;
  submittedAt: string;
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

  /** Admin/Manager/Staff: ảnh khuôn mặt hội viên tự gửi đang chờ duyệt */
  listPendingReviews: async (): Promise<{ data: FacePendingReview[]; total: number }> => {
    const res = await apiClient.get('/faces/reviews');
    return res.data;
  },

  /** Admin/Manager/Staff: duyệt hoặc từ chối (kèm lý do) — hội viên nhận email kết quả */
  review: async (
    memberId: string,
    approved: boolean,
    reason?: string,
  ): Promise<{ success: boolean; message: string; emailSent: boolean }> => {
    const res = await apiClient.post(`/faces/member/${memberId}/review`, { approved, reason });
    return res.data;
  },

  /** Admin/Manager/Staff: nhắc hội viên chưa xác thực khuôn mặt (thông báo + email) */
  remind: async (
    memberId: string,
  ): Promise<{ success: boolean; message: string; emailSent: boolean }> => {
    const res = await apiClient.post(`/faces/member/${memberId}/remind`);
    return res.data;
  },
};
