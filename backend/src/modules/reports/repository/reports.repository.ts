export interface ReportRow {
  totalRevenue?: number;
  totalMembers?: number;
  totalCheckIns?: number;
  totalSessions?: number;
  [key: string]: unknown;
}

export interface ReportsRepository {
  revenue(query?: { from?: Date; to?: Date; branchId?: string }): Promise<{ totalRevenue: number }>;
  attendance(query?: { from?: Date; to?: Date; branchId?: string }): Promise<any[]>;
  members(query?: { branchId?: string }): Promise<any[]>;
}
