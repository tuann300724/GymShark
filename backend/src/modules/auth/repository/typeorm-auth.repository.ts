import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AuthRepository,
  AuthUserRow,
  AuthMemberRef,
  AuthProfile,
  AuthUserRow as UserRow,
  CreateUserInput,
  CreateEmailVerificationInput,
  CreatePasswordResetInput,
  ConfirmRegistrationResult,
  CreateGoogleMemberInput,
} from './auth.repository';

/**
 * TypeORMAuthRepository — adapter (infrastructure layer) trong Clean Architecture.
 *
 * Toàn bộ thao tác data đi qua Stored Procedure (EXEC sp_*) qua DataSource.query.
 * Class này là NƠI DUY NHẤT biết về TypeORM + tên SP — service chỉ thấy interface
 * AuthRepository. SP đã có TRY/CATCH; các SP transaction (confirm/reset/google)
 * tự BEGIN TRAN/ROLLBACK, adapter không cần bọc transaction.
 *
 * Lưu ý tham số EXEC: giá trị truyền qua dataSource.query(sql, [v0, v1...])
 * với @0, @1... — param NULL được driver suy luận loại (đã de-risk test OK).
 */
@Injectable()
export class TypeOrmAuthRepository implements AuthRepository {
  constructor(private readonly dataSource: DataSource) {}

  // ===================== ĐỌC (SELECT qua SP) =====================

  async findUserByEmail(email: string): Promise<AuthUserRow | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_user_by_email @email = @0',
      [email],
    );
    return (rows as any[])?.[0] ?? null;
  }

  async findUserById(id: string): Promise<AuthUserRow | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_user_by_id @id = @0',
      [id],
    );
    return (rows as any[])?.[0] ?? null;
  }

  async findUserByPhone(phone: string): Promise<{ id: string; fullName: string } | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_user_by_phone @phone = @0',
      [phone],
    );
    return (rows as any[])?.[0] ?? null;
  }

  async findMemberByUserId(userId: string): Promise<AuthMemberRef | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_member_by_user_id @userId = @0',
      [userId],
    );
    return (rows as any[])?.[0] ?? null;
  }

  /**
   * Profile GET /auth/profile — SP trả flat (branchName, trainerId...),
   * adapter reshape sang nested {branch:{...}, trainer:{...}} khớp shape Prisma
   * mà frontend đang consume (vd admin/settings đọc profile.branch.name).
   */
  async getProfile(userId: string): Promise<AuthProfile | null> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_get_profile @userId = @0',
      [userId],
    );
    const r = (rows as any[])?.[0];
    if (!r) return null;

    // reshape nested — chỉ thêm key branch/trainer khi có dữ liệu (LEFT JOIN có thể NULL)
    const profile: AuthProfile = {
      id: r.id,
      email: r.email,
      fullName: r.fullName,
      phone: r.phone,
      role: r.role,
      status: r.status,
      avatarUrl: r.avatarUrl,
      branchId: r.branchId,
      createdAt: r.createdAt,
    };
    if (r.branchId_rel) {
      profile.branch = { id: r.branchId_rel, name: r.branchName, code: r.branchCode };
    }
    if (r.trainerId) {
      profile.trainer = {
        id: r.trainerId,
        specialization: r.specialization ?? null,
        rating: r.rating ?? null,
      };
    }
    return profile;
  }

  async findActiveBranch(): Promise<{ id: string } | null> {
    const rows = await this.dataSource.query('EXEC sp_auth_find_active_branch');
    return (rows as any[])?.[0] ?? null;
  }

  // ===================== EMAIL VERIFICATION =====================

  async findEmailVerificationByEmail(email: string) {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_email_verification @email = @0',
      [email],
    );
    return ((rows as any[])?.[0] ?? null) as any;
  }

  async createEmailVerification(input: CreateEmailVerificationInput): Promise<{ id: string }> {
    const rows = await this.dataSource.query(
      `EXEC sp_auth_create_email_verification
         @email = @0, @fullName = @1, @phone = @2, @passwordHash = @3, @codeHash = @4,
         @gender = @5, @dateOfBirth = @6, @address = @7, @emergencyContact = @8,
         @branchId = @9, @expiresAt = @10`,
      [
        input.email,
        input.fullName,
        input.phone,
        input.passwordHash,
        input.codeHash,
        input.gender,
        input.dateOfBirth ?? null,
        input.address ?? null,
        input.emergencyContact ?? null,
        input.branchId,
        input.expiresAt,
      ],
    );
    return { id: (rows as any[])?.[0]?.id };
  }

  async resendEmailVerification(id: string, codeHash: string, expiresAt: Date): Promise<void> {
    await this.dataSource.query(
      'EXEC sp_auth_resend_email_verification @id = @0, @codeHash = @1, @expiresAt = @2',
      [id, codeHash, expiresAt],
    );
  }

  async incrementVerificationAttempts(id: string): Promise<number> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_increment_verification_attempts @id = @0',
      [id],
    );
    return (rows as any[])?.[0]?.attempts ?? 0;
  }

  async deleteEmailVerification(target: { id?: string; email?: string }): Promise<void> {
    await this.dataSource.query(
      'EXEC sp_auth_delete_email_verification @id = @0, @email = @1',
      [target.id ?? null, target.email ?? null],
    );
  }

  // ===================== PASSWORD RESET =====================

  async findPasswordResetByEmail(email: string) {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_find_password_reset @email = @0',
      [email],
    );
    return ((rows as any[])?.[0] ?? null) as any;
  }

  async createPasswordReset(input: CreatePasswordResetInput): Promise<{ id: string }> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_create_password_reset @email = @0, @codeHash = @1, @expiresAt = @2',
      [input.email, input.codeHash, input.expiresAt],
    );
    return { id: (rows as any[])?.[0]?.id };
  }

  async incrementResetAttempts(id: string): Promise<number> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_increment_reset_attempts @id = @0',
      [id],
    );
    return (rows as any[])?.[0]?.attempts ?? 0;
  }

  async deletePasswordReset(target: { id?: string; email?: string }): Promise<void> {
    await this.dataSource.query(
      'EXEC sp_auth_delete_password_reset @id = @0, @email = @1',
      [target.id ?? null, target.email ?? null],
    );
  }

  // ===================== GHI / TRANSACTION =====================

  async createUser(input: CreateUserInput): Promise<AuthUserRow> {
    const rows = await this.dataSource.query(
      `EXEC sp_auth_create_user
         @email = @0, @passwordHash = @1, @fullName = @2, @phone = @3,
         @role = @4, @branchId = @5`,
      [
        input.email,
        input.passwordHash,
        input.fullName,
        input.phone ?? null,
        input.role,
        input.branchId ?? null,
      ],
    );
    return (rows as any[])?.[0] as AuthUserRow;
  }

  async confirmMemberRegistration(input: {
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
  }): Promise<ConfirmRegistrationResult> {
    const rows = await this.dataSource.query(
      `EXEC sp_auth_confirm_member_registration
         @email = @0, @passwordHash = @1, @fullName = @2, @phone = @3,
         @gender = @4, @dateOfBirth = @5, @address = @6, @emergencyContact = @7,
         @branchId = @8, @verificationId = @9`,
      [
        input.email,
        input.passwordHash,
        input.fullName,
        input.phone,
        input.gender,
        input.dateOfBirth ?? null,
        input.address ?? null,
        input.emergencyContact ?? null,
        input.branchId,
        input.verificationId,
      ],
    );
    const r = (rows as any[])?.[0];
    // reshape kết quả SP (flat) -> {user, member} khớp contract service từng trả
    return {
      user: {
        id: r.userId,
        email: r.userEmail,
        fullName: r.userFullName,
        phone: r.userPhone,
        role: r.userRole,
        status: r.userStatus,
        branchId: r.userBranchId,
        createdAt: r.createdAt,
      },
      member: {
        id: r.memberId,
        code: r.memberCode,
        fullName: r.userFullName,
        email: r.userEmail,
        phone: r.userPhone,
        status: r.userStatus,
      },
    };
  }

  async resetPassword(
    email: string,
    passwordHash: string,
  ): Promise<{ id: string; email: string; fullName: string }> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_reset_password @email = @0, @passwordHash = @1',
      [email, passwordHash],
    );
    return (rows as any[])?.[0];
  }

  async createGoogleMember(input: CreateGoogleMemberInput): Promise<AuthUserRow> {
    const rows = await this.dataSource.query(
      `EXEC sp_auth_create_google_member
         @email = @0, @passwordHash = @1, @fullName = @2, @branchId = @3,
         @avatarUrl = @4, @providerId = @5, @memberPhone = @6`,
      [
        input.email,
        input.passwordHash,
        input.fullName,
        input.branchId,
        input.avatarUrl ?? null,
        input.providerId,
        input.memberPhone,
      ],
    );
    return (rows as any[])?.[0] as AuthUserRow;
  }

  async linkGoogleProvider(
    id: string,
    providerId: string,
    avatarUrl?: string | null,
  ): Promise<AuthUserRow> {
    const rows = await this.dataSource.query(
      'EXEC sp_auth_link_google_provider @id = @0, @providerId = @1, @avatarUrl = @2',
      [id, providerId, avatarUrl ?? null],
    );
    return (rows as any[])?.[0] as AuthUserRow;
  }
}
