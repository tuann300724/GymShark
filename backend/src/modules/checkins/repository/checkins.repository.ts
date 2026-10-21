/**
 * CheckinsRepository — Port (Clean Architecture) cho module check-in.
 *
 * Toàn bộ thao tác data đi qua Stored Procedure (SP) cho create/list;
 * các thao tác đọc khác được thực hiện qua direct SQL qua DataSource.
 */

export interface CheckInRow {
  id: string;
  memberId: string;
  branchId: string;
  checkInTime: Date;
  checkOutTime: Date | null;
  method: string;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  member?: {
    id: string;
    code: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string | null;
  } | null;
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface CheckInCreateInput {
  memberId: string;
  branchId: string;
  checkInTime: Date;
  method?: string;
  notes?: string | null;
  status?: string;
}

export interface CheckInListQuery {
  memberId?: string | null;
  branchId?: string | null;
  from?: Date | string | null;
  to?: Date | string | null;
  limit?: number;
  status?: string | null;
  search?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  page?: number | null;
  skip?: number | null;
}

export interface CheckinsRepository {
  create(input: CheckInCreateInput): Promise<CheckInRow>;
  list(query?: CheckInListQuery): Promise<CheckInRow[]>;
  findOne(id: string): Promise<CheckInRow | null>;
  findActive(memberId: string): Promise<CheckInRow | null>;
  findMany(query?: CheckInListQuery): Promise<CheckInRow[]>;
  updateCheckout(
    id: string,
    data: { checkOutTime: Date; status?: string },
  ): Promise<CheckInRow>;
  count(query?: Pick<CheckInListQuery, "memberId" | "branchId" | "status" | "from" | "to" | "search">): Promise<number>;
}
