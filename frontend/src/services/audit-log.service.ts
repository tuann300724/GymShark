import apiClient from '@/lib/axios';
import type { AuditLogsListResponse } from './types';

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entity?: string;
  search?: string;
  /** ISO date — lọc từ ngày (00:00:00) */
  from?: string;
  /** ISO date — lọc đến ngày (23:59:59) */
  to?: string;
}

export const auditLogApi = {
  /** Nhật ký hoạt động toàn hệ thống — chỉ ADMIN/MANAGER */
  getAll: async (params: AuditLogQuery = {}): Promise<AuditLogsListResponse> => {
    const res = await apiClient.get<AuditLogsListResponse>('/audit-logs', { params });
    return res.data;
  },
};
