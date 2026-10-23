import apiClient from '@/lib/axios';
import type { Room } from './types';

export const roomApi = {
  rooms: async (): Promise<Room[]> => {
    const res = await apiClient.get<Room[]>('/rooms');
    return res.data;
  },

  createRoom: async (payload: {
    code?: string;
    name: string;
    type?: string;
    capacity?: number;
    floor?: string;
    description?: string;
    status?: string;
  }) => {
    const res = await apiClient.post('/rooms', payload);
    return res.data;
  },

  updateRoom: async (
    id: string,
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
    const res = await apiClient.patch(`/rooms/${id}`, payload);
    return res.data;
  },

  setRoomStatus: async (id: string, status: string) => {
    const res = await apiClient.patch(`/rooms/${id}/status`, { status });
    return res.data;
  },

  removeRoom: async (id: string) => {
    const res = await apiClient.delete(`/rooms/${id}`);
    return res.data;
  },
};
