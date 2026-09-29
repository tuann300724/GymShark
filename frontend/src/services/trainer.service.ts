import apiClient from '@/lib/axios';
import type {
  TrainerAssignment,
  TrainerDetail,
  TrainerListResponse,
  TrainerListItem,
  TrainerPublic,
} from './types';

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

  myTrainer: async (): Promise<{
    trainer: TrainerPublic | null;
    assignment: TrainerAssignment | null;
  }> => {
    const res = await apiClient.get('/trainers/me');
    return res.data;
  },
};

/** Danh sách HLV làm nguồn cho form Select (chỉ ACTIVE) */
