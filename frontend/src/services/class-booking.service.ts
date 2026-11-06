import apiClient from '@/lib/axios';
import type { ClassBookingRecord, ClassSessionItem } from './types';

/** API đăng ký ca nhóm (ClassBooking) — hội viên tự book/hủy chỗ */
export const classBookingApi = {
  /** Các ca nhóm sắp tới đang mở đăng ký + cờ "đã đăng ký" của tôi */
  listOpen: async (): Promise<{ data: ClassSessionItem[]; total: number }> => {
    const res = await apiClient.get('/class-bookings/open');
    return res.data;
  },

  /** Ca nhóm mà tôi đã đăng ký */
  listMine: async (): Promise<{ data: ClassBookingRecord[]; total: number }> => {
    const res = await apiClient.get('/class-bookings/mine');
    return res.data;
  },

  /** Đăng ký 1 chỗ */
  create: async (scheduleId: string) => {
    const res = await apiClient.post('/class-bookings', { scheduleId });
    return res.data as { booking: { id: string }; bookedCount: number; slotsLeft: number };
  },

  /** Hủy đăng ký */
  cancel: async (id: string) => {
    const res = await apiClient.delete(`/class-bookings/${id}`);
    return res.data as { message: string };
  },

  /** [HLV/QTV] Danh sách hội viên đã đăng ký 1 ca */
  listBySession: async (scheduleId: string) => {
    const res = await apiClient.get(`/class-bookings/session/${scheduleId}`);
    return res.data as {
      data: {
        id: string;
        createdAt: string;
        member: {
          id: string;
          code: string;
          fullName: string;
          phone?: string | null;
          email?: string | null;
          avatarUrl?: string | null;
        };
      }[];
      total: number;
    };
  },

  /** [HLV/QTV] Gán nhiều hội viên vào 1 ca nhóm */
  addMembers: async (scheduleId: string, memberIds: string[]) => {
    const res = await apiClient.post(`/class-bookings/session/${scheduleId}/members`, {
      memberIds,
    });
    return res.data as {
      added: number;
      skipped: number;
      bookedCount: number;
      slotsLeft: number;
    };
  },

  /** [HLV/QTV] Bỏ 1 hội viên khỏi ca nhóm */
  removeMember: async (scheduleId: string, memberId: string) => {
    const res = await apiClient.delete(`/class-bookings/session/${scheduleId}/members/${memberId}`);
    return res.data as { message: string };
  },
};
