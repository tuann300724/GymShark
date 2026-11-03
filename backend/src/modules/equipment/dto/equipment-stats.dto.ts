export interface EquipmentStats {
  status: string;
  count: number;
}

export interface EquipmentUsage {
  equipmentId: string;
  name: string;
  type: string;
  usageCount: number;
}