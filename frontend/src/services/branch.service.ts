import apiClient from '@/lib/axios';
import type { Branch, BranchStats, Room } from './types';

export const branchApi = {
  // Branch
  list: async (): Promise<Branch[]> => {
    const res = await apiClient.get<Branch[]>('/branches');
    return res.data;
  },

  detail: async (id: string): Promise<Branch> => {
    const res = await apiClient.get<Branch>(`/branches/${id}`);
    return res.data;
  },

  stats: async (id: string): Promise<BranchStats> => {
    const res = await apiClient.get<BranchStats>(`/branches/${id}/stats`);
    return res.data;
  },

  create: async (payload: {
    code: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    description?: string;
    openingTime?: string;
    closingTime?: string;
    openingHours?: string;
    status?: string;
  }) => {
    const res = await apiClient.post('/branches', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      code: string;
      name: string;
      address: string;
      phone: string;
      email: string | null;
      description: string | null;
      openingTime: string | null;
      closingTime: string | null;
      openingHours: string | null;
      status: string;
    }>,
  ) => {
    const res = await apiClient.patch(`/branches/${id}`, payload);
    return res.data;
  },

  setStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await apiClient.patch(`/branches/${id}/status`, { status });
    return res.data;
  },

  remove: async (id: string) => {
    const res = await apiClient.delete(`/branches/${id}`);
    return res.data;
  },

  // Rooms (theo chi nhánh)
  rooms: async (branchId: string): Promise<Room[]> => {
    const res = await apiClient.get<Room[]>(`/branches/${branchId}/rooms`);
    return res.data;
  },

  createRoom: async (
    branchId: string,
    payload: {
      code: string;
      name: string;
      type?: string;
      capacity?: number;
      floor?: string;
      description?: string;
      status?: string;
    },
  ) => {
    const res = await apiClient.post(`/branches/${branchId}/rooms`, payload);
    return res.data;
  },

  updateRoom: async (
    branchId: string,
    roomId: string,
    payload: Partial<{
      code: string;
      name: string;
      type: string;
      capacity: number;
      floor: string | null;
      description: string | null;
      status: string;
    }>,
  ) => {
    const res = await apiClient.patch(`/branches/${branchId}/rooms/${roomId}`, payload);
    return res.data;
  },

  setRoomStatus: async (branchId: string, roomId: string, status: string) => {
    const res = await apiClient.patch(`/branches/${branchId}/rooms/${roomId}/status`, { status });
    return res.data;
  },

  removeRoom: async (branchId: string, roomId: string) => {
    const res = await apiClient.delete(`/branches/${branchId}/rooms/${roomId}`);
    return res.data;
  },
};
