/**
 * EquipmentRepository — Port (Clean Architecture) cho module thiết bị + bảo trì.
 *
 * Toàn bộ thao tác data đi qua Stored Procedure. Service chỉ thấy interface này.
 * Adapter TypeORM nằm ở `typeorm-equipment.repository.ts`.
 */

/** Nhánh rút gọn (shape tương đương Prisma `select`). */
export interface EquipmentBranchRef {
  id: string;
  name: string;
  code: string;
  status?: string;
  address?: string | null;
  phone?: string | null;
}

export interface EquipmentRoomRef {
  id: string;
  name: string;
  code: string | null;
  type?: string;
  capacity?: number;
  status?: string;
}

/** Phiếu bảo trì (shape tương đương model EquipmentMaintenance). */
export interface EquipmentMaintenanceItem {
  id: string;
  equipmentId: string;
  type: string;
  maintenanceDate: Date | null;
  cost: number | null;
  description: string;
  performedBy: string | null;
  status: string;
  nextDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  equipment?: {
    id: string;
    code: string;
    name: string;
    status?: string;
    branch?: EquipmentBranchRef | null;
  } | null;
}

/** Thiết bị đầy đủ (shape tương đương Prisma model Equipment + include). */
export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string | null;
  model: string | null;
  status: string;
  condition: string;
  serialNumber: string | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  warrantyExpiry: Date | null;
  lastMaintenanceAt: Date | null;
  nextMaintenanceAt: Date | null;
  description: string | null;
  branchId: string;
  roomId: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch: EquipmentBranchRef | null;
  room: EquipmentRoomRef | null;
  maintenances: EquipmentMaintenanceItem[];
}

export interface EquipmentListQuery {
  page: number;
  limit: number;
  search?: string | null;
  category?: string | null;
  status?: string | null;
  condition?: string | null;
  branchId?: string | null;
  roomId?: string | null;
}

export interface MaintenanceListQuery {
  page: number;
  limit: number;
  equipmentId?: string | null;
  branchId?: string | null;
  status?: string | null;
  type?: string | null;
}

export interface CreateEquipmentInput {
  code: string;
  name: string;
  category: string;
  branchId: string;
  roomId?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  warrantyExpiry?: Date | null;
  status?: string | null;
  condition?: string | null;
  nextMaintenanceAt?: Date | null;
  description?: string | null;
}

/** Patch — field có mặt (kể cả null) mới được ghi đè. */
export interface UpdateEquipmentInput {
  code?: string | null;
  name?: string | null;
  category?: string | null;
  branchId?: string | null;
  roomId?: string | null;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchasePrice?: number | null;
  warrantyExpiry?: Date | null;
  status?: string | null;
  condition?: string | null;
  lastMaintenanceAt?: Date | null;
  nextMaintenanceAt?: Date | null;
  description?: string | null;
}

export interface CreateMaintenanceInput {
  equipmentId: string;
  type?: string | null;
  maintenanceDate?: Date | null;
  cost?: number | null;
  description: string;
  performedBy?: string | null;
  status?: string | null;
  nextDueDate?: Date | null;
}

export interface CompleteMaintenanceInput {
  cost?: number | null;
  performedBy?: string | null;
  description?: string | null;
  condition?: string | null;
  nextDueDate?: Date | null;
  markBroken?: boolean;
}

export interface EquipmentStatsShape {
  total: number;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  available: number;
  inUse: number;
  maintenance: number;
  broken: number;
  retired: number;
  alerts: {
    overdue: number;
    upcoming: number;
    broken: number;
    warrantyExpiring: number;
  };
  maintenanceThisMonth: number;
}

export interface EquipmentAlertLists {
  overdue: EquipmentItem[];
  upcoming: EquipmentItem[];
  broken: EquipmentItem[];
  warranty: EquipmentItem[];
}

export interface EquipmentRepository {
  // ---- Đọc ----
  listEquipment(query: EquipmentListQuery): Promise<EquipmentItem[]>;
  countEquipment(query: Omit<EquipmentListQuery, "page" | "limit">): Promise<number>;
  findEquipment(id: string): Promise<EquipmentItem | null>;
  /** Tìm thiết bị theo mã (kiểm tra trùng mã). */
  findEquipmentByCode(code: string): Promise<{ id: string } | null>;
  /** Tìm thiết bị theo serial (kiểm tra trùng serial). */
  findEquipmentBySerial(
    serialNumber: string,
    excludeId?: string | null,
  ): Promise<{ id: string } | null>;
  equipmentStats(): Promise<EquipmentStatsShape>;
  equipmentAlerts(branchScopeId?: string | null): Promise<EquipmentAlertLists>;
  findBranchById(id: string): Promise<{ id: string; name: string } | null>;
  /** Phòng có thuộc chi nhánh không? */
  roomBelongsToBranch(roomId: string, branchId: string): Promise<boolean>;

  // ---- Ghi ----
  createEquipment(input: CreateEquipmentInput): Promise<EquipmentItem>;
  updateEquipment(id: string, input: UpdateEquipmentInput): Promise<EquipmentItem | null>;
  setEquipmentStatus(id: string, status: string): Promise<EquipmentItem | null>;

  // ---- Bảo trì ----
  listMaintenance(query: MaintenanceListQuery): Promise<EquipmentMaintenanceItem[]>;
  countMaintenance(
    query: Omit<MaintenanceListQuery, "page" | "limit">,
  ): Promise<number>;
  findMaintenance(id: string): Promise<EquipmentMaintenanceItem | null>;
  createMaintenance(input: CreateMaintenanceInput): Promise<EquipmentMaintenanceItem>;
  completeMaintenance(
    id: string,
    input: CompleteMaintenanceInput,
  ): Promise<{ maintenance: EquipmentMaintenanceItem; equipment: EquipmentItem | null }>;
  cancelMaintenance(id: string): Promise<EquipmentMaintenanceItem | null>;
  /** Còn phiếu bảo trì SCHEDULED/IN_PROGRESS của thiết bị không? */
  hasActiveMaintenance(equipmentId: string): Promise<boolean>;
}
