import apiClient from '@/lib/axios';
import type {
  Equipment,
  EquipmentAlerts,
  EquipmentConditionValue,
  EquipmentListResponse,
  EquipmentMaintenance,
  EquipmentStats,
  EquipmentStatusValue,
  MaintenanceListResponse,
} from './types';

export interface EquipmentQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  branchId?: string;
  roomId?: string;
}

export const equipmentApi = {
  list: async (params?: EquipmentQuery): Promise<EquipmentListResponse> => {
    const res = await apiClient.get<EquipmentListResponse>('/equipment', { params });
    return res.data;
  },

  detail: async (id: string): Promise<Equipment> => {
    const res = await apiClient.get<Equipment>(`/equipment/${id}`);
    return res.data;
  },

  stats: async (): Promise<EquipmentStats> => {
    const res = await apiClient.get<EquipmentStats>('/equipment/stats');
    return res.data;
  },

  alerts: async (): Promise<EquipmentAlerts> => {
    const res = await apiClient.get<EquipmentAlerts>('/equipment/alerts');
    return res.data;
  },

  create: async (payload: {
    code: string;
    name: string;
    category: string;
    branchId: string;
    roomId?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    warrantyExpiry?: string;
    status?: EquipmentStatusValue;
    condition?: EquipmentConditionValue;
    nextMaintenanceAt?: string;
    description?: string;
  }) => {
    const res = await apiClient.post('/equipment', payload);
    return res.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      code: string;
      name: string;
      category: string;
      roomId: string | null;
      brand: string | null;
      model: string | null;
      serialNumber: string | null;
      purchaseDate: string | null;
      purchasePrice: number | null;
      warrantyExpiry: string | null;
      status: EquipmentStatusValue;
      condition: EquipmentConditionValue;
      nextMaintenanceAt: string | null;
      description: string | null;
    }>,
  ) => {
    const res = await apiClient.patch(`/equipment/${id}`, payload);
    return res.data;
  },

  setStatus: async (id: string, status: EquipmentStatusValue) => {
    const res = await apiClient.patch(`/equipment/${id}/status`, { status });
    return res.data;
  },

  remove: async (id: string) => {
    const res = await apiClient.delete(`/equipment/${id}`);
    return res.data;
  },

  // Maintenance
  maintenanceList: async (params?: {
    page?: number;
    limit?: number;
    equipmentId?: string;
    branchId?: string;
    status?: string;
    type?: string;
  }): Promise<MaintenanceListResponse> => {
    const res = await apiClient.get<MaintenanceListResponse>('/equipment-maintenance', { params });
    return res.data;
  },

  createMaintenance: async (payload: {
    equipmentId: string;
    type?: string;
    maintenanceDate?: string;
    cost?: number;
    description: string;
    performedBy?: string;
    nextDueDate?: string;
    status?: string;
  }) => {
    const res = await apiClient.post('/equipment-maintenance', payload);
    return res.data;
  },

  completeMaintenance: async (
    id: string,
    payload: {
      cost?: number;
      nextDueDate?: string;
      performedBy?: string;
      description?: string;
      condition?: EquipmentConditionValue;
      markBroken?: boolean;
    },
  ) => {
    const res = await apiClient.patch(`/equipment-maintenance/${id}/complete`, payload);
    return res.data;
  },

  cancelMaintenance: async (id: string) => {
    const res = await apiClient.post(`/equipment-maintenance/${id}/cancel`);
    return res.data;
  },
};
