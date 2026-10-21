/**
 * AuthRepository — interface (Port) trong Clean Architecture.
 *
 * AuthService (application layer) chỉ phụ thuộc interface này, KHÔNG biết
 * data đi qua TypeORM/SP hay Prisma. Việc implement (adapter) nằm ở
 * `typeorm-auth.repository.ts`. Nhờ vậy:
 *   - business logic test được mà không cần DB thật (mock repository);
 *   - đổi hạ tầng data (thêm Prisma->TypeORM->...) không đụng service;
 *   - mọi thao tác data của auth đi qua Stored Procedure (yêu cầu thầy).
 *
 * bcrypt.compare / bcrypt.hash vẫn ở service (SQL Server không có bcrypt) —
 * repository chỉ trả/ghi dữ liệu thô.
 */

/** User row đọc từ bảng users — đủ cột cho login + build JWT payload. */
export interface AuthUserRow {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  phone?: string | null;
  role: string;
  status: string;
  avatarUrl?: string | null;
  provider?: string;
  providerId?: string | null;
  branchId?: string | null;
  createdAt?: Date | string;
}

/** Thành viên liên kết User (đính kèm login response). */
export interface AuthMemberRef {
  id: string;
  code: string;
}

/** Profile GET /auth/profile — shape nested khớp Prisma (branch/trainer object). */
export interface AuthProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: string;
  status: string;
  avatarUrl?: string | null;
  branchId?: string | null;
  createdAt?: Date | string;
  branch?: { id: string; name: string; code: string } | null;
  trainer?: { id: string; specialization?: string | null; rating?: number | null } | null;
}

/** Dữ liệu tạo User (register / google). */
export interface CreateUserInput {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string | null;
  role: string;
  branchId?: string | null;
}

/** Dữ liệu tạo yêu cầu xác minh email (bước 1 đăng ký hội viên). */
export interface CreateEmailVerificationInput {
  email: string;
  fullName: string;
  phone: string;
  passwordHash: string;
  codeHash: string;
  gender: string;
  dateOfBirth?: Date | null;
  address?: string | null;
  emergencyContact?: string | null;
  branchId: string | null;
  expiresAt: Date;
}

/** Dữ liệu tạo yêu cầu đặt lại mật khẩu. */
export interface CreatePasswordResetInput {
  email: string;
  codeHash: string;
  expiresAt: Date;
}

/** Kết quả transaction đăng ký hội viên (User + Member vừa tạo). */
export interface ConfirmRegistrationResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    status: string;
    branchId?: string | null;
    createdAt?: Date | string;
  };
  member: { id: string; code: string; fullName: string; email?: string | null; phone?: string; status?: string };
}

/** Dữ liệu tạo tài khoản từ Google OAuth. */
export interface CreateGoogleMemberInput {
  email: string;
  passwordHash: string;
  fullName: string;
  branchId: string;
  avatarUrl?: string | null;
  providerId: string;
  memberPhone: string;
}

export interface AuthRepository {
  // ---- Đọc (SELECT qua SP) ----
  /** Tìm user theo email — trả cả passwordHash để service bcrypt.compare. */
  findUserByEmail(email: string): Promise<AuthUserRow | null>;

  /** Tìm user theo id — dùng cho JwtStrategy.validate (mọi request). */
  findUserById(id: string): Promise<AuthUserRow | null>;

  /** Tìm user theo phone — chặn trùng số điện thoại. */
  findUserByPhone(phone: string): Promise<{ id: string; fullName: string } | null>;

  /** Tìm member liên kết userId (lấy memberId đính kèm login). */
  findMemberByUserId(userId: string): Promise<AuthMemberRef | null>;

  /** Profile đầy đủ (user + branch + trainer) — reshape nested trong adapter. */
  getProfile(userId: string): Promise<AuthProfile | null>;

  /** Chi nhánh ACTIVE đầu tiên (luồng đăng ký / google). */
  findActiveBranch(): Promise<{ id: string } | null>;

  // ---- Email verification ----
  findEmailVerificationByEmail(email: string): Promise<
    | (CreateEmailVerificationInput & {
        id: string;
        attempts: number;
        expiresAt: Date;
        lastSentAt?: Date | null;
      })
    | null
  >;

  /** Tạo (ghi đè) yêu cầu xác minh — dọn yêu cầu cũ trong transaction. */
  createEmailVerification(input: CreateEmailVerificationInput): Promise<{ id: string }>;

  /** Gửi lại mã: cập nhật codeHash + expiresAt + reset attempts. */
  resendEmailVerification(id: string, codeHash: string, expiresAt: Date): Promise<void>;

  /** Tăng attempts nhập sai — trả attempts mới. */
  incrementVerificationAttempts(id: string): Promise<number>;

  /** Xoá yêu cầu xác minh (theo id hoặc email). */
  deleteEmailVerification(target: { id?: string; email?: string }): Promise<void>;

  // ---- Password reset ----
  findPasswordResetByEmail(email: string): Promise<
    { id: string; email: string; codeHash: string; attempts: number; expiresAt: Date; lastSentAt?: Date | null } | null
  >;

  /** Tạo (ghi đè) yêu cầu reset — gộp delete+create transaction. */
  createPasswordReset(input: CreatePasswordResetInput): Promise<{ id: string }>;

  /** Tăng attempts nhập sai mã reset — trả attempts mới. */
  incrementResetAttempts(id: string): Promise<number>;

  /** Xoá yêu cầu reset (theo id hoặc email). */
  deletePasswordReset(target: { id?: string; email?: string }): Promise<void>;

  // ---- Ghi / transaction (SP transaction + TRY/CATCH) ----
  /** Tạo user (register). Throw Conflict nếu email trùng. */
  createUser(input: CreateUserInput): Promise<AuthUserRow>;

  /** Transaction đăng ký hội viên: User + Member + Notification + xóa verification. */
  confirmMemberRegistration(input: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    gender: string;
    dateOfBirth?: Date | null;
    address?: string | null;
    emergencyContact?: string | null;
    branchId: string;
    verificationId: string;
  }): Promise<ConfirmRegistrationResult>;

  /** Transaction reset password: update password + xóa reset record. */
  resetPassword(email: string, passwordHash: string): Promise<{ id: string; email: string; fullName: string }>;

  /** Transaction tạo tài khoản Google: User + Member + Notification. */
  createGoogleMember(input: CreateGoogleMemberInput): Promise<AuthUserRow>;

  /** Liên kết provider Google vào tài khoản LOCAL. */
  linkGoogleProvider(id: string, providerId: string, avatarUrl?: string | null): Promise<AuthUserRow>;
}
