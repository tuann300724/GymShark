import apiClient from '@/lib/axios';
import type {
  AttendanceReport,
  BranchOverviewReport,
  EquipmentStatsReport,
  MembersReport,
  MembershipsReport,
  OverviewReport,
  ReportSummary,
  RevenueReport,
  TrainersReport,
} from './types';

export interface ReportFilters {
  branchId?: string;
  from?: string;
  to?: string;
  search?: string;
  packageId?: string;
}

export const reportApi = {
  summary: async (branchId?: string): Promise<ReportSummary> => {
    const res = await apiClient.get<ReportSummary>('/reports/summary', {
      params: branchId ? { branchId } : {},
    });
    return res.data;
  },

  overview: async (branchId?: string): Promise<OverviewReport> => {
    const res = await apiClient.get<OverviewReport>('/reports/overview', {
      params: branchId ? { branchId } : {},
    });
    return res.data;
  },

  revenue: async (params: ReportFilters = {}): Promise<RevenueReport> => {
    const res = await apiClient.get<RevenueReport>('/reports/revenue', { params });
    return res.data;
  },

  members: async (params: ReportFilters = {}): Promise<MembersReport> => {
    const res = await apiClient.get<MembersReport>('/reports/members', { params });
    return res.data;
  },

  memberships: async (params: ReportFilters = {}): Promise<MembershipsReport> => {
    const res = await apiClient.get<MembershipsReport>('/reports/memberships', { params });
    return res.data;
  },

  trainers: async (params: ReportFilters = {}): Promise<TrainersReport> => {
    const res = await apiClient.get<TrainersReport>('/reports/trainers', { params });
    return res.data;
  },

  attendance: async (params: ReportFilters = {}): Promise<AttendanceReport> => {
    const res = await apiClient.get<AttendanceReport>('/reports/attendance', { params });
    return res.data;
  },

  equipment: async (): Promise<EquipmentStatsReport> => {
    const res = await apiClient.get<EquipmentStatsReport>('/reports/equipment');
    return res.data;
  },

  branches: async (): Promise<BranchOverviewReport> => {
    const res = await apiClient.get<BranchOverviewReport>('/reports/branches');
    return res.data;
  },

  /** Xuất CSV — tự tải file (BOM để Excel mở tiếng Việt đúng) */
  downloadCsv: async (
    type: 'revenue' | 'members' | 'attendance' | 'memberships',
    params: ReportFilters = {},
  ) => {
    const res = await apiClient.get('/reports/export/csv', {
      params: { type, ...params },
      responseType: 'blob',
    });
    const disposition = (res.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename="?([^";]+)"?/);
    const filename = match?.[1] || `${type}.csv`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return filename;
  },
};
