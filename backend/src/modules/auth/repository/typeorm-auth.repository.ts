import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { UserRole, UserStatus } from '../../../database/enums';
import { User } from '../../../database/entities/user.entity';
import { Member } from '../../../database/entities/member.entity';
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

@Injectable()
export class TypeOrmAuthRepository implements AuthRepository {
  private userRepo: Repository<User>;
  private memberRepo: Repository<Member>;
  constructor(private readonly dataSource: DataSource) {
    this.userRepo = this.dataSource.getRepository(User);
    this.memberRepo = this.dataSource.getRepository(Member);
  }

  async findUserByEmail(email: string): Promise<AuthUserRow | null> {
    const u = await this.userRepo.findOne({ where: { email }, relations: ['branch', 'trainer', 'member'] });
    return u ? (u as any) : null;
  }
  async findUserById(id: string): Promise<AuthUserRow | null> {
    const u = await this.userRepo.findOne({ where: { id }, relations: ['branch', 'trainer', 'member'] });
    return u ? (u as any) : null;
  }
  async findUserByPhone(phone: string): Promise<{ id: string; fullName: string } | null> {
    const u = await this.userRepo.findOne({ where: { phone } });
    return u ? { id: u.id, fullName: (u as any).fullName || u.email } : null;
  }
  async findMemberByUserId(userId: string): Promise<AuthMemberRef | null> {
    const m = await this.memberRepo.findOne({ where: { userId } });
    return m ? (m as any) : null;
  }
  async findEmailVerificationByEmail(email: string): Promise<any> { return null; }
  async findPasswordResetByEmail(email: string): Promise<any> { return null; }

  async getProfile(userId: string): Promise<AuthProfile | null> {
    const u = await this.userRepo.findOne({ where: { id: userId }, relations: ['branch', 'member'] });
    return u ? (u as any) : null;
  }
  async findActiveBranch(): Promise<{ id: string } | null> {
    // Return first branch for compatibility; real logic via service
    const b = await this.dataSource.query('SELECT id, name, code FROM branches LIMIT 1');
    return (b as any[])?.[0] ?? null;
  }
  async createUser(input: CreateUserInput): Promise<AuthUserRow> {
    const u = this.userRepo.create({ email: input.email, passwordHash: input.passwordHash, role: UserRole.MEMBER, fullName: input.fullName || input.email, phone: input.phone || null, status: UserStatus.ACTIVE, branchId: input.branchId || null } as any);
    const saved = await this.userRepo.save(u);
    return saved as unknown as AuthUserRow;
  }
  async findEmailVerification(email: string, codeHash: string) { return null; }
  async createEmailVerification(input: CreateEmailVerificationInput) { return null; }
  async deleteEmailVerification(target: { id?: string; email?: string }) { return; }
  async resendEmailVerification(id: string, codeHash: string, expiresAt: Date) { return; }
  async incrementVerificationAttempts(id: string): Promise<number> { return 0; }
  async findPasswordReset(email: string, codeHash?: string) { return null; }
  async createPasswordReset(input: CreatePasswordResetInput) { return null; }
  async deletePasswordReset(target: { id?: string; email?: string }) { return; }
  async incrementResetAttempts(id: string): Promise<number> { return 0; }
  async resetPassword(email: string, passwordHash: string): Promise<{ id: string; email: string; fullName: string }> {
    await this.userRepo.update({ email }, { passwordHash, updatedAt: new Date() });
    const u = await this.userRepo.findOne({ where: { email } });
    return { id: u?.id || '', email: u?.email || email, fullName: (u as any)?.fullName || '' };
  }
  async confirmMemberRegistration(input: { email: string; passwordHash: string; fullName: string; phone: string; gender: string; dateOfBirth?: Date | null; address?: string | null; emergencyContact?: string | null; branchId: string; verificationId: string }): Promise<ConfirmRegistrationResult> { return { user: { id: '', email: input.email, fullName: input.fullName, role: 'MEMBER', status: 'ACTIVE', branchId: input.branchId, createdAt: new Date() }, member: { id: '', code: '', fullName: input.fullName, email: input.email, phone: input.phone, status: 'ACTIVE' } }; }
  async createGoogleMember(input: CreateGoogleMemberInput): Promise<AuthUserRow> {
    const u = this.userRepo.create({ email: input.email, passwordHash: input.passwordHash, role: UserRole.MEMBER, fullName: input.fullName || input.email, status: UserStatus.ACTIVE, branchId: input.branchId, avatarUrl: input.avatarUrl || null, provider: 'google', providerId: input.providerId } as any);
    const saved = await this.userRepo.save(u);
    return saved as unknown as AuthUserRow;
  }
  async linkGoogleProvider(id: string, providerId: string, avatarUrl?: string | null): Promise<AuthUserRow> {
    await this.userRepo.update(id, { provider: 'google', providerId, avatarUrl: avatarUrl || null, updatedAt: new Date() });
    const u = await this.userRepo.findOne({ where: { id } });
    return (u as AuthUserRow) || ({ id } as AuthUserRow);
  }
}
