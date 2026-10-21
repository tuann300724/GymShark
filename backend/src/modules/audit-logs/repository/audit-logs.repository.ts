export interface AuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: string | null;
  ip: string | null;
  createdAt: Date;
  user_id?: string | null;
  user_email?: string | null;
  user_fullName?: string | null;
  user_role?: string | null;
}
export interface AuditLogsRepository {
  list(query?: any): Promise<{ data: AuditLogRow[]; total: number; page: number; limit: number; totalPages: number; actions: string[] }>;
  create(params: { userId?: string | null; action: string; entity: string; entityId?: string | null; metadata?: any; ip?: string | null }): Promise<void>;
}