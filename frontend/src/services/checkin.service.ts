import apiClient from '@/lib/axios';
import type {
  AdminCheckInRecord,
  CheckInsListResponse,
  CheckInResult,
  CurrentlyInsideRecord,
  DailyAttendanceReport,
  HourlyAttendanceReport,
  CurrentCheckIn,
  MemberAttendanceReport,
  MemberCheckIn,
} from './types';

export const checkinApi = {
  /** Lịch sử check-in cá nhân + thống kê */
  getMyCheckins: async (
    page = 1,
    limit = 10,
    filters?: { month?: string; fromDate?: string; toDate?: string },
  ): Promise<{
    data: MemberCheckIn[];
    total: number;
    page: number;
    limit: number;
    stats: { total: number; month: number; week: number; avgDuration: number };
  }> => {
    const res = await apiClient.get('/checkins/me/history', {
      params: { page, limit, ...filters },
    });
    return res.data;
  },

  /** Trạng thái hiện tại: đang trong phòng hay chưa */
  getMyCurrent: async (): Promise<CurrentCheckIn> => {
    const res = await apiClient.get('/checkins/me/current');
    return res.data;
  },

  /** Member tự check-in */
  checkIn: async (method = 'MANUAL', branchId?: string): Promise<CheckInResult> => {
    const res = await apiClient.post('/checkins', { method, branchId });
    return res.data;
  },

  /** Member tự check-out */
  checkOut: async (): Promise<CheckInResult> => {
    const res = await apiClient.post('/checkins/checkout');
    return res.data;
  },

  /** Lễ tân check-in giúp hội viên */
  staffCheckIn: async (memberId: string, note?: string): Promise<CheckInResult> => {
    const res = await apiClient.post('/checkins/staff', { memberId, method: 'STAFF', note });
    return res.data;
  },

  /** Admin/Staff check-out cho một phiên đang mở */
  adminCheckOut: async (checkInId: string): Promise<CheckInResult> => {
    const res = await apiClient.post(`/checkins/${checkInId}/checkout`);
    return res.data;
  },

  /** Lịch sử toàn hệ thống (admin) */
  getAdminCheckins: async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      branchId?: string;
      fromDate?: string;
      toDate?: string;
      sortBy?: string;
      sortOrder?: string;
    } = {},
  ): Promise<CheckInsListResponse> => {
    const res = await apiClient.get('/checkins', { params });
    return res.data;
  },

  /** Hội viên đang có mặt trong phòng */
  getCurrentlyInside: async (): Promise<CurrentlyInsideRecord[]> => {
    const res = await apiClient.get('/checkins/currently-inside');
    return res.data;
  },

  /** Báo cáo daily (số lượt theo ngày) */
  getDailyReport: async (from?: string, to?: string): Promise<DailyAttendanceReport> => {
    const res = await apiClient.get('/reports/checkins/daily', { params: { from, to } });
    return res.data;
  },

  /** Báo cáo theo giờ trong ngày (biểu đồ) */
  getHourlyReport: async (date?: string): Promise<HourlyAttendanceReport> => {
    const res = await apiClient.get('/reports/checkins/hourly', { params: { date } });
    return res.data;
  },

  /** Thống kê chuyên cần theo hội viên */
  getMemberAttendance: async (
    params: {
      from?: string;
      to?: string;
      search?: string;
    } = {},
  ): Promise<MemberAttendanceReport> => {
    const res = await apiClient.get('/reports/checkins/members', { params });
    return res.data;
  },
};

/** Lấy danh sách hội viên để staff chọn check-in (tái sử dụng admin members API) */
export const searchMembersForCheckIn = async (search: string) => {
  const res = await apiClient.get('/members', {
    params: { search, limit: 10 },
  });
  return res.data as { data: any[]; total: number };
};
