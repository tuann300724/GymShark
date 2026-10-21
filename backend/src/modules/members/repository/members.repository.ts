/**
 * MembersRepository — Port (Clean Architecture) cho module hội viên.
 *
 * Toàn bộ thao tác data đi qua Stored Procedure. Service chỉ thấy interface này.
 * Adapter TypeORM nằm ở `typeorm-members.repository.ts`.
 */

/** Dòng hội viên trong danh sách (kèm branch/user rút gọn). */
export interface MemberListRow {
  id: string;
  code: string;
  userId: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  gender: string;
  dateOfBirth: Date | null;
  address: string | null;
  avatarUrl: string | null;
  status: string;
  notes: string | null;
  emergencyContact: string | null;
  joinedAt: Date | null;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_status?: string | null;
}

export interface MemberListQuery {
  page: number;
  limit: number;
  search?: string | null;
  status?: string | null;
  branchId?: string | null;
  membershipStatus?: string | null;
  packageId?: string | null;
  sortField?: string;
  sortDir?: string;
}

export interface MembershipRow {
  id: string;
  memberId: string;
  packageId: string;
  startDate: Date;
  endDate: Date;
  price: string | number;
  discountAmount: string | number | null;
  finalAmount: string | number | null;
  remainingSessions: number | null;
  status: string;
  createdAt: Date;
  package_id?: string | null;
  package_code?: string | null;
  package_name?: string | null;
  package_durationDays?: number | null;
  [key: string]: unknown;
}

export interface CreateMemberInput {
  userId?: string | null;
  code: string;
  fullName: string;
  email?: string | null;
  phone: string;
  gender?: string;
  dateOfBirth?: Date | null;
  address?: string | null;
  emergencyContact?: string | null;
  branchId: string;
}

export interface UpdateMemberInput {
  fullName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  status?: string;
}

export interface MembersRepository {
  // ---- Đọc ----
  count(
    query: Omit<MemberListQuery, "page" | "limit" | "sortField" | "sortDir">,
  ): Promise<number>;
  list(query: MemberListQuery): Promise<MemberListRow[]>;
  findOne(id: string): Promise<MemberListRow | null>;
  findById(id: string): Promise<MemberListRow | null>;
  findByCode(code: string): Promise<MemberListRow | null>;
  findByUserId(userId: string): Promise<MemberListRow | null>;
  /** Tìm user theo email (chặn trùng / đồng bộ email đăng nhập). */
  findByEmail(
    email: string,
  ): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
  } | null>;
  /** Tìm user theo phone (chặn trùng số điện thoại). */
  findUserByPhone(
    phone: string,
  ): Promise<{ id: string; fullName: string } | null>;
  countAll(): Promise<number>;
  stats(): Promise<{
    total: number;
    active: number;
    pending: number;
    expired: number;
    inactive: number;
  }>;

  memberships(memberId: string, top?: number): Promise<MembershipRow[]>;
  payments(memberId: string, top?: number): Promise<Record<string, unknown>[]>;
  checkIns(memberId: string, top?: number): Promise<Record<string, unknown>[]>;
  schedules(memberId: string, top?: number): Promise<Record<string, unknown>[]>;
  attendanceStats(memberId: string): Promise<{
    totalVisits: number;
    lastVisit: Date | null;
    doneCount: number;
    totalMinutes: number | null;
  }>;
  getTrainers(memberId: string): Promise<Record<string, unknown>[]>;

  // ---- Ghi ----
  create(input: CreateMemberInput): Promise<MemberListRow>;
  /** Transaction: tạo User + Member + Notification (đăng ký tại quầy, không có SP tổng hợp). */
  createWithUser(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    branchId: string;
    code: string;
    gender?: string;
    dateOfBirth?: Date | null;
    address?: string | null;
    emergencyContact?: string | null;
  }): Promise<{ userId: string; memberId: string }>;

  update(id: string, input: UpdateMemberInput): Promise<MemberListRow | null>;
  updateStatus(id: string, status: string): Promise<void>;
  delete(id: string): Promise<void>;

  /** Đồng bộ email/trạng thái sang bảng users. */
  updateUserStatusEmail(
    id: string,
    input: { status?: string; email?: string; setEmail?: boolean },
  ): Promise<void>;
  createNotification(input: {
    userId?: string | null;
    memberId?: string | null;
    title: string;
    content: string;
    type?: string;
    link?: string | null;
  }): Promise<void>;

  findBranchById(
    id: string,
  ): Promise<{ id: string; status: string; name: string; code: string } | null>;
  findActiveBranch(): Promise<{ id: string } | null>;
}
