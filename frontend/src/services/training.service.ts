import apiClient from '@/lib/axios';
import type {
  MySessionsResponse,
  SessionDetail,
  SessionProgress,
  SessionsListResponse,
  TrainerSessionsResponse,
  TrainingSession,
} from './types';

export interface SessionQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  trainerId?: string;
  memberId?: string;
  branchId?: string;
  status?: string;
  type?: string;
}

export const trainingApi = {
  // Admin / Staff / Trainer
  list: async (params?: SessionQuery): Promise<SessionsListResponse> => {
    const res = await apiClient.get<SessionsListResponse>('/training-sessions', { params });
    return res.data;
  },

  detail: async (id: string): Promise<SessionDetail> => {
    const res = await apiClient.get<SessionDetail>(`/training-sessions/${id}`);
    return res.data;
  },

  create: async (payload: {
    trainerId: string;
    memberId?: string;
    branchId?: string;
    roomId?: string;
    type: string;
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => {
    const res = await apiClient.post('/training-sessions', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      trainerId: string;
      memberId: string | null;
      branchId: string;
      roomId: string | null;
      type: string;
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      notes: string;
    }>,
  ) => {
    const res = await apiClient.patch(`/training-sessions/${id}`, payload);
    return res.data;
  },

  cancel: async (id: string, cancellationNote?: string) => {
    const res = await apiClient.post(`/training-sessions/${id}/cancel`, { cancellationNote });
    return res.data;
  },

  complete: async (id: string) => {
    const res = await apiClient.post(`/training-sessions/${id}/complete`);
    return res.data;
  },

  remove: async (id: string) => {
    const res = await apiClient.delete(`/training-sessions/${id}`);
    return res.data;
  },

  // Member portal
  getMy: async (params?: SessionQuery): Promise<MySessionsResponse> => {
    const res = await apiClient.get<MySessionsResponse>('/training-sessions/me', { params });
    return res.data;
  },

  getMyUpcoming: async (): Promise<MySessionsResponse> => {
    const res = await apiClient.get<MySessionsResponse>('/training-sessions/me/upcoming');
    return res.data;
  },

  // Trainer portal
  getTrainerMe: async (params?: SessionQuery): Promise<TrainerSessionsResponse> => {
    const res = await apiClient.get<TrainerSessionsResponse>('/training-sessions/trainer/me', {
      params,
    });
    return res.data;
  },

  // Training progress
  getProgress: async (sessionId: string): Promise<SessionProgress[]> => {
    const res = await apiClient.get<SessionProgress[]>(`/training-sessions/${sessionId}/progress`);
    return res.data;
  },

  addProgress: async (
    sessionId: string,
    payload: { note: string; performance?: string; recommendation?: string },
  ) => {
    const res = await apiClient.post(`/training-sessions/${sessionId}/progress`, payload);
    return res.data;
  },

  updateProgress: async (
    progressId: string,
    payload: { note?: string; performance?: string; recommendation?: string },
  ) => {
    const res = await apiClient.patch(`/training-progress/${progressId}`, payload);
    return res.data;
  },
};

/** Các buổi tập theo ngày trong view day/week/month */
