import apiClient from '@/lib/axios';

export type StaffShiftStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface StaffShift {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  title: string;
  startTime: string;
  endTime: string;
  status: StaffShiftStatus;
  notes: string | null;
  paidPaymentCount: number;
  memberCount: number;
  totalRevenue: number;
  cashExpected: number | null;
  cashCounted: number | null;
  cashDifference: number | null;
  closedById: string | null;
  closedByName: string | null;
  closedAt: string | null;
  closeNotes: string | null;
  startedAt: string | null;
  endedAt: string | null;
}

export interface StaffShiftTemplate {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  title: string;
  weekday: number;
  startMinute: number;
  endMinute: number;
  notes: string | null;
  isActive: boolean;
}

export interface StaffShiftSettlementPreview {
  shiftId: string;
  expectedCash: number;
  cashPaymentCount: number;
  bankTransferExpected: number;
  bankTransferPaymentCount: number;
  pendingCashCount: number;
}

export interface StaffShiftSettlementPayload {
  cashCounted: number;
  note?: string;
}

export interface StaffShiftFilters {
  from?: string;
  to?: string;
  staffId?: string;
  status?: string;
}

export interface StaffShiftReport {
  data: StaffShift[];
  summary: {
    totalRevenue: number;
    transactionCount: number;
    memberCount: number;
  };
  byDay: ShiftReportGroup[];
  byStaff: ShiftReportGroup[];
}

export interface ShiftReportGroup {
  id?: string | null;
  label: string;
  totalRevenue: number;
  transactionCount: number;
  memberCount: number;
}

export interface StaffShiftPayload {
  staffId: string;
  title: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

export interface StaffShiftTemplatePayload {
  staffId: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

export const staffShiftApi = {
  list: async (params: StaffShiftFilters = {}): Promise<StaffShiftReport> => {
    const res = await apiClient.get<StaffShiftReport>('/staff-shifts', { params });
    return res.data;
  },

  options: async (): Promise<{
    staff: { id: string; fullName: string; email: string }[];
  }> => {
    const res = await apiClient.get('/staff-shifts/options');
    return res.data;
  },

  templates: async (): Promise<StaffShiftTemplate[]> => {
    const res = await apiClient.get<StaffShiftTemplate[]>('/staff-shifts/templates');
    return res.data;
  },

  createTemplate: async (payload: StaffShiftTemplatePayload): Promise<StaffShiftTemplate> => {
    const res = await apiClient.post<StaffShiftTemplate>('/staff-shifts/templates', payload);
    return res.data;
  },

  removeTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff-shifts/templates/${id}`);
  },

  generateFromTemplates: async (payload: { from: string; to: string }) => {
    const res = await apiClient.post('/staff-shifts/templates/generate', payload);
    return res.data as { message: string; createdCount: number; skippedCount: number };
  },

  create: async (payload: StaffShiftPayload): Promise<StaffShift> => {
    const res = await apiClient.post<StaffShift>('/staff-shifts', payload);
    return res.data;
  },

  update: async (id: string, payload: Partial<StaffShiftPayload>): Promise<StaffShift> => {
    const res = await apiClient.patch<StaffShift>(`/staff-shifts/${id}`, payload);
    return res.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff-shifts/${id}`);
  },

  cancel: async (id: string): Promise<StaffShift> => {
    const res = await apiClient.post<StaffShift>(`/staff-shifts/${id}/cancel`);
    return res.data;
  },

  start: async (id: string): Promise<StaffShift> => {
    const res = await apiClient.post<StaffShift>(`/staff-shifts/${id}/start`);
    return res.data;
  },

  settlementPreview: async (id: string): Promise<StaffShiftSettlementPreview> => {
    const res = await apiClient.get<StaffShiftSettlementPreview>(
      `/staff-shifts/${id}/settlement-preview`,
    );
    return res.data;
  },

  end: async (id: string, payload: StaffShiftSettlementPayload): Promise<StaffShift> => {
    const res = await apiClient.post<StaffShift>(`/staff-shifts/${id}/end`, payload);
    return res.data;
  },
};
