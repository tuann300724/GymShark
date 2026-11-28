import apiClient from '@/lib/axios';
import type {
  TrainerAssignment,
  TrainerDetail,
  TrainerListResponse,
  TrainerListItem,
  TrainerProfileDraft,
  TrainerPublic,
} from './types';

/** Ảnh bằng cấp / chứng chỉ gửi kèm đơn (data URL đã nén) */
export interface TrainerDocumentInput {
  caption?: string;
  dataUrl: string;
}

export type TrainerApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** Đơn đăng ký PT tự do (chưa có tài khoản) */
export interface TrainerApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  specialization: string;
  certification?: string | null;
  experienceYears: number;
  bio: string;
  hourlyRate?: string | number | null;
  avatarUrl?: string | null;
  status: TrainerApplicationStatus;
  rejectReason?: string | null;
  reviewedAt?: string | null;
  trainerId?: string | null;
  createdAt: string;
  _count?: { documents: number };
}

/** Bản chỉnh sửa hồ sơ PT chờ duyệt + hồ sơ đang hiển thị để so sánh */
export interface TrainerProfileChange extends TrainerDetail {
  currentProfile: Required<TrainerProfileDraft>;
}

/** Khu vực dạy của PT (toạ độ chính xác — chỉ chính chủ thấy) */
export interface TrainerWorkArea {
  workAddress: string | null;
  workLatitude: number | null;
  workLongitude: number | null;
}

export const trainerWorkAreaApi = {
  get: async () => {
    const res = await apiClient.get<TrainerWorkArea | null>('/trainers/me/work-area');
    return res.data;
  },
  update: async (data: {
    workAddress: string;
    workLatitude: number | null;
    workLongitude: number | null;
  }) => {
    const res = await apiClient.patch<{ message: string; area: TrainerWorkArea }>(
      '/trainers/me/work-area',
      data,
    );
    return res.data;
  },
};

export const trainerApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    specialization?: string;
  }): Promise<TrainerListResponse> => {
    const res = await apiClient.get<TrainerListResponse>('/trainers', { params });
    return res.data;
  },

  detail: async (id: string): Promise<TrainerDetail> => {
    const res = await apiClient.get<TrainerDetail>(`/trainers/${id}`);
    return res.data;
  },

  create: async (payload: {
    fullName: string;
    email: string;
    phone?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string;
    specialization: string;
    certification?: string;
    experienceYears?: number;
    bio?: string;
    avatarUrl?: string;
    hourlyRate?: number;
    commissionRate?: number;
    status?: string;
  }) => {
    const res = await apiClient.post('/trainers', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      fullName: string;
      email: string;
      phone: string;
      gender: 'MALE' | 'FEMALE' | 'OTHER';
      dateOfBirth: string;
      specialization: string;
      certification: string;
      experienceYears: number;
      bio: string;
      avatarUrl: string;
      hourlyRate: number;
      commissionRate: number;
      status: string;
    }>,
  ) => {
    const res = await apiClient.patch(`/trainers/${id}`, payload);
    return res.data;
  },

  remove: async (id: string) => {
    const res = await apiClient.delete(`/trainers/${id}`);
    return res.data;
  },

  members: async (trainerId: string): Promise<TrainerAssignment[]> => {
    const res = await apiClient.get<TrainerAssignment[]>(`/trainers/${trainerId}/members`);
    return res.data;
  },

  assignMember: async (trainerId: string, memberId: string) => {
    const res = await apiClient.post(`/trainers/${trainerId}/members/${memberId}`);
    return res.data;
  },

  unassignMember: async (trainerId: string, memberId: string) => {
    const res = await apiClient.delete(`/trainers/${trainerId}/members/${memberId}`);
    return res.data;
  },

  myMembers: async (): Promise<TrainerAssignment[]> => {
    const res = await apiClient.get<TrainerAssignment[]>('/trainers/me/members');
    return res.data;
  },

  myProfile: async (): Promise<TrainerDetail> => {
    const res = await apiClient.get<TrainerDetail>('/trainers/me/profile');
    return res.data;
  },

  /** HLV tự chỉnh hồ sơ công khai + phí kèm riêng (VND/buổi) */
  updateMyProfile: async (payload: {
    specialization?: string;
    certification?: string | null;
    experienceYears?: number;
    bio?: string | null;
    avatarUrl?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dateOfBirth?: string | null;
    hourlyRate?: number | null;
  }): Promise<{
    message: string;
    /** DRAFT = chờ admin duyệt; APPLICATION = hồ sơ đăng ký gửi (lại); DIRECT = áp dụng ngay */
    mode: 'DRAFT' | 'APPLICATION' | 'DIRECT';
    trainer: TrainerDetail;
  }> => {
    const res = await apiClient.patch('/trainers/me/profile', payload);
    return res.data;
  },

  /** HLV huỷ bản chỉnh sửa hồ sơ đang chờ duyệt */
  cancelMyProfileDraft: async (): Promise<{ message: string }> => {
    const res = await apiClient.delete('/trainers/me/profile/pending');
    return res.data;
  },

  /** Công khai: PT tự do gửi đơn đăng ký + ảnh bằng cấp (chưa tạo tài khoản) */
  apply: async (payload: {
    fullName: string;
    email: string;
    phone: string;
    specialization: string;
    certification?: string;
    experienceYears: number;
    bio: string;
    avatarUrl?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    hourlyRate?: number;
    documents: TrainerDocumentInput[];
  }): Promise<{ message: string; id: string; emailSent: boolean }> => {
    const res = await apiClient.post('/trainer-applications', payload);
    return res.data;
  },

  /** Admin: đơn đăng ký PT theo trạng thái */
  applications: async (status: TrainerApplicationStatus = 'PENDING') => {
    const res = await apiClient.get<{
      data: TrainerApplication[];
      counts: Partial<Record<TrainerApplicationStatus, number>>;
    }>('/trainer-applications', { params: { status } });
    return res.data;
  },

  applicationDocuments: async (id: string) => {
    const res = await apiClient.get<(TrainerDocumentInput & { id: string })[]>(
      `/trainer-applications/${id}/documents`,
    );
    return res.data;
  },

  /** Duyệt (tạo tài khoản PT + email mật khẩu tạm) / từ chối đơn */
  reviewApplication: async (
    id: string,
    approved: boolean,
    reason?: string,
  ): Promise<{ message: string; emailSent: boolean; temporaryPassword?: string }> => {
    const res = await apiClient.post(`/trainer-applications/${id}/review`, { approved, reason });
    return res.data;
  },

  /** Admin: bản chỉnh sửa hồ sơ PT đang chờ duyệt */
  profileChanges: async (): Promise<TrainerProfileChange[]> => {
    const res = await apiClient.get<TrainerProfileChange[]>('/trainers/profile-changes');
    return res.data;
  },

  reviewProfileChange: async (
    id: string,
    approved: boolean,
    reason?: string,
  ): Promise<{ message: string; emailSent: boolean }> => {
    const res = await apiClient.post(`/trainers/${id}/profile-review`, { approved, reason });
    return res.data;
  },

  myTrainer: async (): Promise<{
    trainer: TrainerPublic | null;
    assignment: TrainerAssignment | null;
  }> => {
    const res = await apiClient.get('/trainers/me');
    return res.data;
  },
};

/** Danh sách HLV làm nguồn cho form Select (chỉ ACTIVE) */
