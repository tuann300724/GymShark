import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  CompleteMaintenanceInput,
  CreateEquipmentInput,
  CreateMaintenanceInput,
  EquipmentAlertLists,
  EquipmentItem,
  EquipmentListQuery,
  EquipmentMaintenanceItem,
  EquipmentRepository,
  EquipmentStatsShape,
  MaintenanceListQuery,
  UpdateEquipmentInput,
} from "./equipment.repository";

/**
 * TypeOrmEquipmentRepository — adapter hạ tầng cho EquipmentRepository.
 *
 * Mọi thao tác data đi qua Stored Procedure (EXEC sp_*). SP đã có TRY/CATCH +
 * transaction; driver mssql chỉ trả result set ĐẦU TIÊN nên mỗi SP trả về
 * đúng 1 result set.
 */
@Injectable()
export class TypeOrmEquipmentRepository implements EquipmentRepository {
  constructor(private readonly dataSource: DataSource) {}

  private first<T>(rows: unknown): T | null {
    return ((rows as Array<Record<string, unknown>> | undefined)?.[0] ??
      null) as T | null;
  }

  private str(v: unknown): string | null {
    if (v === undefined || v === null || v === "") return null;
    return String(v);
  }

  // ===================== ĐỌC =====================

  async listEquipment(query: EquipmentListQuery): Promise<EquipmentItem[]> {
    const rows = (await this.dataSource.query(
      `EXECUTE sp_equipment_list @page=@0, @limit=@1, @search=@2, @category=@3, @status=@4, @condition=@5, @branchId=@6, @roomId=@7, @sortField='createdAt', @sortDir='desc'`,
      [
        query.page,
        query.limit,
        this.str(query.search),
        this.str(query.category),
        this.str(query.status),
        this.str(query.condition),
        this.str(query.branchId),
        this.str(query.roomId),
      ],
    )) as Array<Record<string, unknown>>;

    // SP join tối đa 3 phiếu bảo trì / thiết bị -> gom lại theo id.
    const grouped = new Map<string, Array<Record<string, unknown>>>();
    for (const row of rows ?? []) {
      const id = String(row["id"] ?? "");
      if (!id) continue;
      const bucket = grouped.get(id);
      if (bucket) bucket.push(row);
      else grouped.set(id, [row]);
    }
    return Array.from(grouped.values()).map((bucket) => this.toEquipment(bucket));
  }

  async countEquipment(
    query: Omit<EquipmentListQuery, "page" | "limit">,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_list_count @branchId=@0, @status=@1, @category=@2, @condition=@3, @search=@4, @roomId=@5`,
      [
        this.str(query.branchId),
        this.str(query.status),
        this.str(query.category),
        this.str(query.condition),
        this.str(query.search),
        this.str(query.roomId),
      ],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async findEquipment(id: string): Promise<EquipmentItem | null> {
    const rows = (await this.dataSource.query(
      `EXECUTE sp_equipment_find_one @id=@0`,
      [id],
    )) as Array<Record<string, unknown>>;
    if (!rows?.length) return null;
    return this.toEquipment(rows);
  }

  async findEquipmentByCode(code: string): Promise<{ id: string } | null> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_find_by_code @code=@0`,
      [code],
    );
    const row = this.first<{ id: string }>(rows);
    return row ? { id: row.id } : null;
  }

  async findEquipmentBySerial(
    serialNumber: string,
    excludeId?: string | null,
  ): Promise<{ id: string } | null> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_find_by_serial @serial=@0, @excludeId=@1`,
      [serialNumber, excludeId ?? null],
    );
    const row = this.first<{ id: string }>(rows);
    return row ? { id: row.id } : null;
  }

  async equipmentStats(): Promise<EquipmentStatsShape> {
    const rows = ((await this.dataSource.query(
      `EXECUTE sp_equipment_stats`,
    )) as Array<Record<string, unknown>>) ?? [];

    let total = 0;
    const byStatus: Record<string, number> = {};
    const byCondition: Record<string, number> = {};
    const alerts = { overdue: 0, upcoming: 0, broken: 0, warrantyExpiring: 0 };
    let maintenanceThisMonth = 0;

    for (const row of rows) {
      const metric = String(row["metric"] ?? "");
      const value = Number(row["value"] ?? 0);
      if (metric === "byStatus") byStatus[String(row["key"])] = value;
      else if (metric === "byCondition") byCondition[String(row["key"])] = value;
      else if (metric === "total") total = value;
      else if (metric === "overdue") alerts.overdue = value;
      else if (metric === "upcoming") alerts.upcoming = value;
      else if (metric === "broken") alerts.broken = value;
      else if (metric === "warrantyExpiring") alerts.warrantyExpiring = value;
      else if (metric === "maintenanceThisMonth") maintenanceThisMonth = value;
    }

    return {
      total,
      byStatus,
      byCondition,
      available: byStatus["AVAILABLE"] ?? 0,
      inUse: byStatus["IN_USE"] ?? 0,
      maintenance: byStatus["MAINTENANCE"] ?? 0,
      broken: byStatus["BROKEN"] ?? 0,
      retired: byStatus["RETIRED"] ?? 0,
      alerts,
      maintenanceThisMonth,
    };
  }

  async equipmentAlerts(
    branchScopeId?: string | null,
  ): Promise<EquipmentAlertLists> {
    const scope = branchScopeId ? `AND e.branchId = @b` : ``;
    const params: unknown[] = branchScopeId ? [branchScopeId] : [];

    const overdue = await this.alertQuery(
      `SELECT e.id, e.code, e.name, e.status, e.nextMaintenanceAt, e.branchId,
              b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
              r.id AS room_id, r.code AS room_code, r.name AS room_name
       FROM dbo.equipment e
       LEFT JOIN dbo.branches b ON e.branchId = b.id
       LEFT JOIN dbo.rooms r ON e.roomId = r.id
       WHERE e.nextMaintenanceAt IS NOT NULL AND e.nextMaintenanceAt < GETUTCDATE()
         AND e.status IN ('AVAILABLE','IN_USE','MAINTENANCE') ${scope}
       ORDER BY e.nextMaintenanceAt ASC`,
      params,
    );

    const upcoming = await this.alertQuery(
      `SELECT e.id, e.code, e.name, e.status, e.nextMaintenanceAt, e.branchId,
              b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
              r.id AS room_id, r.code AS room_code, r.name AS room_name
       FROM dbo.equipment e
       LEFT JOIN dbo.branches b ON e.branchId = b.id
       LEFT JOIN dbo.rooms r ON e.roomId = r.id
       WHERE e.nextMaintenanceAt IS NOT NULL
         AND e.nextMaintenanceAt >= GETUTCDATE()
         AND e.nextMaintenanceAt <= DATEADD(DAY, 14, GETUTCDATE())
         AND e.status IN ('AVAILABLE','IN_USE') ${scope}
       ORDER BY e.nextMaintenanceAt ASC`,
      params,
    );

    const broken = await this.alertQuery(
      `SELECT e.id, e.code, e.name, e.status, e.updatedAt, e.branchId,
              b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
              r.id AS room_id, r.code AS room_code, r.name AS room_name
       FROM dbo.equipment e
       LEFT JOIN dbo.branches b ON e.branchId = b.id
       LEFT JOIN dbo.rooms r ON e.roomId = r.id
       WHERE e.status = 'BROKEN' ${scope}
       ORDER BY e.updatedAt DESC`,
      params,
    );

    const warranty = await this.alertQuery(
      `SELECT e.id, e.code, e.name, e.status, e.warrantyExpiry, e.branchId,
              b.id AS branch_id, b.code AS branch_code, b.name AS branch_name,
              r.id AS room_id, r.code AS room_code, r.name AS room_name
       FROM dbo.equipment e
       LEFT JOIN dbo.branches b ON e.branchId = b.id
       LEFT JOIN dbo.rooms r ON e.roomId = r.id
       WHERE e.warrantyExpiry IS NOT NULL
         AND e.warrantyExpiry >= GETUTCDATE()
         AND e.warrantyExpiry <= DATEADD(DAY, 30, GETUTCDATE())
         AND e.status <> 'RETIRED' ${scope}
       ORDER BY e.warrantyExpiry ASC`,
      params,
    );

    return { overdue, upcoming, broken, warranty };
  }

  async findBranchById(id: string): Promise<{ id: string; name: string } | null> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_branches_find_by_id @id=@0`,
      [id],
    );
    const row = this.first<{ id: string; name: string }>(rows);
    return row ? { id: row.id, name: row.name } : null;
  }

  async roomBelongsToBranch(
    roomId: string,
    branchId: string,
  ): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM dbo.rooms WHERE id = @0 AND branchId = @1`,
      [roomId, branchId],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0) > 0;
  }

  // ===================== GHI =====================

  async createEquipment(input: CreateEquipmentInput): Promise<EquipmentItem> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_create @code=@0, @name=@1, @category=@2, @branchId=@3, @roomId=@4,
        @brand=@5, @model=@6, @serialNumber=@7, @purchaseDate=@8, @purchasePrice=@9, @warrantyExpiry=@10,
        @status=@11, @condition=@12, @nextMaintenanceAt=@13, @description=@14`,
      [
        input.code,
        input.name,
        input.category,
        input.branchId,
        input.roomId ?? null,
        input.brand ?? null,
        input.model ?? null,
        input.serialNumber ?? null,
        input.purchaseDate ?? null,
        input.purchasePrice ?? null,
        input.warrantyExpiry ?? null,
        input.status ?? "AVAILABLE",
        input.condition ?? "GOOD",
        input.nextMaintenanceAt ?? null,
        input.description ?? null,
      ],
    );
    const item = this.toEquipment((rows ?? []) as Array<Record<string, unknown>>);
    return item;
  }

  async updateEquipment(
    id: string,
    input: UpdateEquipmentInput,
  ): Promise<EquipmentItem | null> {
    const has = (k: keyof UpdateEquipmentInput) =>
      Object.prototype.hasOwnProperty.call(input, k) &&
      input[k] !== undefined;

    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_update @id=@0, @code=@1, @name=@2, @category=@3, @branchId=@4, @roomId=@5,
        @brand=@6, @model=@7, @serialNumber=@8, @purchaseDate=@9, @purchasePrice=@10, @warrantyExpiry=@11,
        @status=@12, @condition=@13, @lastMaintenanceAt=@14, @nextMaintenanceAt=@15, @description=@16,
        @setBranchId=@17, @setRoomId=@18, @setBrand=@19, @setModel=@20, @setSerialNumber=@21,
        @setPurchaseDate=@22, @setPurchasePrice=@23, @setWarrantyExpiry=@24, @setLastMaintenanceAt=@25,
        @setNextMaintenanceAt=@26, @setDescription=@27`,
      [
        id,
        has("code") ? input.code : null,
        has("name") ? input.name : null,
        has("category") ? input.category : null,
        has("branchId") ? input.branchId : null,
        has("roomId") ? input.roomId : null,
        has("brand") ? input.brand : null,
        has("model") ? input.model : null,
        has("serialNumber") ? input.serialNumber : null,
        has("purchaseDate") ? input.purchaseDate : null,
        has("purchasePrice") ? input.purchasePrice : null,
        has("warrantyExpiry") ? input.warrantyExpiry : null,
        has("status") ? input.status : null,
        has("condition") ? input.condition : null,
        has("lastMaintenanceAt") ? input.lastMaintenanceAt : null,
        has("nextMaintenanceAt") ? input.nextMaintenanceAt : null,
        has("description") ? input.description : null,
        has("branchId") ? 1 : 0,
        has("roomId") ? 1 : 0,
        has("brand") ? 1 : 0,
        has("model") ? 1 : 0,
        has("serialNumber") ? 1 : 0,
        has("purchaseDate") ? 1 : 0,
        has("purchasePrice") ? 1 : 0,
        has("warrantyExpiry") ? 1 : 0,
        has("lastMaintenanceAt") ? 1 : 0,
        has("nextMaintenanceAt") ? 1 : 0,
        has("description") ? 1 : 0,
      ],
    );
    const rowsArr = (rows ?? []) as Array<Record<string, unknown>>;
    if (!rowsArr.length) return null;
    return this.toEquipment(rowsArr);
  }

  async setEquipmentStatus(
    id: string,
    status: string,
  ): Promise<EquipmentItem | null> {
    await this.dataSource.query(
      `EXECUTE sp_equipment_set_status @id=@0, @status=@1`,
      [id, status],
    );
    return this.findEquipment(id);
  }

  // ===================== BẢO TRÌ =====================

  async listMaintenance(
    query: MaintenanceListQuery,
  ): Promise<EquipmentMaintenanceItem[]> {
    const rows = (await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_list @page=@0, @limit=@1, @equipmentId=@2, @branchId=@3, @status=@4, @type=@5`,
      [
        query.page,
        query.limit,
        this.str(query.equipmentId),
        this.str(query.branchId),
        this.str(query.status),
        this.str(query.type),
      ],
    )) as Array<Record<string, unknown>>;
    return (rows ?? []).map((row) => this.toMaintenance(row));
  }

  async countMaintenance(
    query: Omit<MaintenanceListQuery, "page" | "limit">,
  ): Promise<number> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_list_count @equipmentId=@0, @branchId=@1, @status=@2, @type=@3`,
      [
        this.str(query.equipmentId),
        this.str(query.branchId),
        this.str(query.status),
        this.str(query.type),
      ],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0);
  }

  async findMaintenance(
    id: string,
  ): Promise<EquipmentMaintenanceItem | null> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_find_one @id=@0`,
      [id],
    );
    const row = this.first<Record<string, unknown>>(rows);
    return row ? this.toMaintenance(row) : null;
  }

  async createMaintenance(
    input: CreateMaintenanceInput,
  ): Promise<EquipmentMaintenanceItem> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_create @equipmentId=@0, @type=@1, @maintenanceDate=@2, @cost=@3,
        @description=@4, @performedBy=@5, @status=@6, @nextDueDate=@7`,
      [
        input.equipmentId,
        input.type ?? "ROUTINE",
        input.maintenanceDate ?? null,
        input.cost ?? null,
        input.description,
        input.performedBy ?? null,
        input.status ?? "IN_PROGRESS",
        input.nextDueDate ?? null,
      ],
    );
    const row = this.first<Record<string, unknown>>(rows);
    if (!row) throw new Error("Không tạo được phiếu bảo trì.");
    return this.toMaintenance(row);
  }

  async completeMaintenance(
    id: string,
    input: CompleteMaintenanceInput,
  ): Promise<{
    maintenance: EquipmentMaintenanceItem;
    equipment: EquipmentItem | null;
  }> {
    const rows = await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_complete @id=@0, @cost=@1, @performedBy=@2, @description=@3, @condition=@4, @nextDueDate=@5, @markBroken=@6`,
      [
        id,
        input.cost ?? null,
        input.performedBy ?? null,
        input.description ?? null,
        input.condition ?? null,
        input.nextDueDate ?? null,
        input.markBroken ? 1 : 0,
      ],
    );
    const row = this.first<Record<string, unknown>>(rows);
    if (!row) throw new Error("Không hoàn tất được phiếu bảo trì.");
    const equipmentId = String(row["equipmentId"] ?? "");
    const equipment = equipmentId ? await this.findEquipment(equipmentId) : null;
    return { maintenance: this.toMaintenance(row), equipment };
  }

  async cancelMaintenance(
    id: string,
  ): Promise<EquipmentMaintenanceItem | null> {
    await this.dataSource.query(
      `EXECUTE sp_equipment_maintenance_cancel @id=@0`,
      [id],
    );
    return this.findMaintenance(id);
  }

  async hasActiveMaintenance(equipmentId: string): Promise<boolean> {
    const rows = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM dbo.equipment_maintenances
       WHERE equipmentId = @0 AND status IN ('SCHEDULED','IN_PROGRESS')`,
      [equipmentId],
    );
    return Number(this.first<{ total: number }>(rows)?.total ?? 0) > 0;
  }

  // ===================== Helpers =====================

  private async alertQuery(
    sql: string,
    params: unknown[],
  ): Promise<EquipmentItem[]> {
    const rows = (await this.dataSource.query(sql, params)) as Array<
      Record<string, unknown>
    >;
    return (rows ?? []).map((row) => this.toEquipment([row]));
  }

  /** Gom các row (1 thiết bị + N phiếu bảo trì) thành shape lồng nhau. */
  private toEquipment(rows: Array<Record<string, unknown>>): EquipmentItem {
    const head = rows[0] ?? ({} as Record<string, unknown>);
    const maintenances: EquipmentMaintenanceItem[] = [];
    for (const row of rows) {
      if (!row["maint_id"]) continue;
      maintenances.push(this.toMaintenance(row, true));
    }
    maintenances.sort((a, b) => {
      const da = a.maintenanceDate ? a.maintenanceDate.getTime() : 0;
      const dbb = b.maintenanceDate ? b.maintenanceDate.getTime() : 0;
      return dbb - da;
    });

    const branchId = head["branch_id"] as string | null;
    return {
      id: String(head["id"] ?? ""),
      code: String(head["code"] ?? ""),
      name: String(head["name"] ?? ""),
      category: String(head["category"] ?? ""),
      brand: (head["brand"] as string | null) ?? null,
      model: (head["model"] as string | null) ?? null,
      status: String(head["status"] ?? ""),
      condition: String(head["condition"] ?? ""),
      serialNumber: (head["serialNumber"] as string | null) ?? null,
      purchaseDate: (head["purchaseDate"] as Date | null) ?? null,
      purchasePrice:
        head["purchasePrice"] !== null && head["purchasePrice"] !== undefined
          ? Number(head["purchasePrice"])
          : null,
      warrantyExpiry: (head["warrantyExpiry"] as Date | null) ?? null,
      lastMaintenanceAt: (head["lastMaintenanceAt"] as Date | null) ?? null,
      nextMaintenanceAt: (head["nextMaintenanceAt"] as Date | null) ?? null,
      description: (head["description"] as string | null) ?? null,
      branchId: String(head["branchId"] ?? ""),
      roomId: (head["roomId"] as string | null) ?? null,
      createdAt: head["createdAt"] as Date,
      updatedAt: head["updatedAt"] as Date,
      branch: branchId
        ? {
            id: branchId,
            name: String(head["branch_name"] ?? ""),
            code: String(head["branch_code"] ?? ""),
          }
        : null,
      room: head["room_id"]
        ? {
            id: String(head["room_id"]),
            name: String(head["room_name"] ?? ""),
            code: (head["room_code"] as string | null) ?? null,
          }
        : null,
      maintenances,
    };
  }

  private toMaintenance(
    row: Record<string, unknown>,
    fromEquipmentJoin = false,
  ): EquipmentMaintenanceItem {
    const id = fromEquipmentJoin
      ? String(row["maint_id"] ?? "")
      : String(row["id"] ?? "");
    const equipmentId = fromEquipmentJoin
      ? String(row["equipmentId"] ?? row["maint_equipmentId"] ?? row["maint_equipment_id"] ?? "")
      : String(row["equipmentId"] ?? row["maint_equipmentId"] ?? row["equipment_id"] ?? "");
    const equipmentIdRef = fromEquipmentJoin
      ? (row["maint_equipment_id"] as string | undefined)
      : (row["equipment_id"] as string | undefined);
    const branchId = fromEquipmentJoin
      ? (row["branch_id"] as string | null)
      : (row["branch_id"] as string | null);

    return {
      id,
      equipmentId,
      type: String(
        fromEquipmentJoin ? (row["maint_type"] ?? "") : (row["type"] ?? ""),
      ),
      maintenanceDate: (fromEquipmentJoin
        ? (row["maint_maintenanceDate"] as Date | null)
        : (row["maintenanceDate"] as Date | null)) ?? null,
      cost:
        fromEquipmentJoin
          ? row["maint_cost"] !== null && row["maint_cost"] !== undefined
            ? Number(row["maint_cost"])
            : null
          : row["cost"] !== null && row["cost"] !== undefined
            ? Number(row["cost"])
            : null,
      description: String(
        fromEquipmentJoin
          ? (row["maint_description"] ?? "")
          : (row["description"] ?? ""),
      ),
      performedBy: (fromEquipmentJoin
        ? (row["maint_performedBy"] as string | null)
        : (row["performedBy"] as string | null)) ?? null,
      status: String(
        fromEquipmentJoin ? (row["maint_status"] ?? "") : (row["status"] ?? ""),
      ),
      nextDueDate: (fromEquipmentJoin
        ? (row["maint_nextDueDate"] as Date | null)
        : (row["nextDueDate"] as Date | null)) ?? null,
      createdAt: (fromEquipmentJoin
        ? (row["maint_createdAt"] as Date)
        : (row["createdAt"] as Date)) as Date,
      updatedAt: (fromEquipmentJoin
        ? (row["maint_updatedAt"] as Date)
        : (row["updatedAt"] as Date)) as Date,
      equipment: equipmentIdRef
        ? {
            id: String(equipmentIdRef),
            code: String(
              fromEquipmentJoin
                ? (row["maint_equipment_code"] ?? "")
                : (row["equipment_code"] ?? ""),
            ),
            name: String(
              fromEquipmentJoin
                ? (row["maint_equipment_name"] ?? "")
                : (row["equipment_name"] ?? ""),
            ),
            status: fromEquipmentJoin
              ? (row["equipment_status"] as string | undefined)
              : (row["equipment_status"] as string | undefined),
            branch: branchId
              ? {
                  id: branchId,
                  name: String(row["branch_name"] ?? ""),
                  code: String(row["branch_code"] ?? ""),
                }
              : null,
          }
        : null,
    };
  }
}
