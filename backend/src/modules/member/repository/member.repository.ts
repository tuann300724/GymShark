/**
 * MemberRepository — Port cho module hội viên (member).
 * Dùng SP cho đọc; service có thể gọi trực tiếp qua adapter.
 */
export interface MemberProfileRow {
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
  // Từ SP members_find_by_id / auth_find_member_by_user_id
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
  user_id?: string | null;
  user_email?: string | null;
  user_role?: string | null;
  user_status?: string | null;
  user_avatarUrl?: string | null;
}

export interface MemberRepository {
  findByUserId(userId: string): Promise<MemberProfileRow | null>;
  findById(id: string): Promise<MemberProfileRow | null>;
  findByCode(code: string): Promise<MemberProfileRow | null>;
  stats(): Promise<{ total: number; active: number; pending: number; expired: number; inactive: number }>;
}
