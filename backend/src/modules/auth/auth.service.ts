import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuditService } from '../audit-logs/audit-logs.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MemberRegisterDto } from './dto/member-register.dto';
import { VerifyMemberRegisterDto } from './dto/verify-member-register.dto';
import type { GoogleProfile } from './google.strategy';
import { Inject } from '@nestjs/common';
import { AuthRepository } from './repository/auth.repository';
import { AUTH_REPOSITORY } from './repository/auth.tokens';

const VERIFY_CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODE_ATTEMPTS = 5;
const EXPIRED_CLEANUP_GRACE_HOURS = 6;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.authRepository.findUserByEmail(email);

    if (!user || !user.passwordHash) {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ip?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    let memberId: string | null = null;
    if (user.role === 'MEMBER') {
      const member = await this.authRepository.findMemberByUserId(user.id);
      if (member) memberId = member.id;
    }

    await this.auditService.log({
      userId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'Auth',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
      ip,
    });

    return {
      message: 'Đăng nhập thành công',
      accessToken,
      memberId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  // ===================== ĐĂNG KÝ HỘI VIÊN TỰ PHỤC VỤ =====================

  async requestMemberRegistrationCode(dto: MemberRegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);
    await this.assertPhoneAvailable(dto.phone?.trim() ?? '');

    const now = Date.now();
    // Dọn yêu cầu cũ đã hết hạn từ lâu (xóa bằng SP nếu có, fallback không cần)
    // Tạo mới sẽ ghi đè qua createEmailVerification (SP đã dọn cũ)
    const branch = await this.authRepository.findActiveBranch();
    if (!branch) {
      throw new BadRequestException('Hệ thống chưa có chi nhánh hoạt động');
    }

    const code = this.generateCode();
    const [codeHash, passwordHash] = await Promise.all([
      bcrypt.hash(code, 10),
      bcrypt.hash(dto.password, 10),
    ]);
    const expiresAt = this.codeExpiry();

    await this.authRepository.createEmailVerification({
      email,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      passwordHash,
      codeHash,
      gender: dto.gender || 'MALE',
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      address: dto.address?.trim() || null,
      emergencyContact: dto.emergencyContact?.trim() || null,
      branchId: branch.id,
      expiresAt,
    });

    try {
      await this.mailService.sendMemberVerificationCode({
        email,
        fullName: dto.fullName,
        code,
        expiresInMinutes: VERIFY_CODE_TTL_MINUTES,
      });
    } catch (e) {
      await this.authRepository.deleteEmailVerification({ email });
      this.logger.warn(`Gửi mã xác minh thất bại cho ${email}: ${e instanceof Error ? e.message : e}`);
      throw e;
    }

    await this.auditService.log({
      action: 'MEMBER_REGISTER_CODE_SENT',
      entity: 'EmailVerification',
      metadata: { email, expiresAt: expiresAt.toISOString() },
      ip,
    });

    return {
      message: 'Mã xác minh đã được gửi về email của bạn',
      email,
      expiresInSeconds: VERIFY_CODE_TTL_MINUTES * 60,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  async resendMemberVerificationCode(emailInput: string, ip?: string) {
    const email = this.normalizeEmail(emailInput);
    const pending = await this.authRepository.findEmailVerificationByEmail(email);

    if (!pending) {
      throw new NotFoundException(
        'Không tìm thấy yêu cầu đăng ký đang chờ. Vui lòng điền lại thông tin để nhận mã mới.',
      );
    }

    const lastSentAt = (pending as any).lastSentAt ? new Date((pending as any).lastSentAt) : null;
    if (lastSentAt) {
      const waitedSeconds = Math.floor((Date.now() - lastSentAt.getTime()) / 1000);
      if (waitedSeconds < RESEND_COOLDOWN_SECONDS) {
        throw new HttpException(
          `Vui lòng chờ ${RESEND_COOLDOWN_SECONDS - waitedSeconds} giây nữa rồi gửi lại mã.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = this.codeExpiry();

    await this.authRepository.resendEmailVerification(pending.id, codeHash, expiresAt);

    try {
      await this.mailService.sendMemberVerificationCode({
        email,
        fullName: pending.fullName,
        code,
        expiresInMinutes: VERIFY_CODE_TTL_MINUTES,
      });
    } catch (e) {
      this.logger.warn(`Gửi lại mã xác minh thất bại cho ${email}: ${e instanceof Error ? e.message : e}`);
      throw e;
    }

    await this.auditService.log({
      action: 'MEMBER_REGISTER_CODE_RESENT',
      entity: 'EmailVerification',
      metadata: { email },
      ip,
    });

    return {
      message: 'Đã gửi lại mã xác minh mới',
      email,
      expiresInSeconds: VERIFY_CODE_TTL_MINUTES * 60,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  async confirmMemberRegistration(dto: VerifyMemberRegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    const pending = await this.authRepository.findEmailVerificationByEmail(email);

    if (!pending) {
      throw new BadRequestException(
        'Không tìm thấy yêu cầu đăng ký đang chờ. Vui lòng đăng ký lại để nhận mã xác minh.',
      );
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await this.authRepository.deleteEmailVerification({ id: pending.id });
      throw new BadRequestException('Mã xác minh đã hết hạn. Vui lòng đăng ký lại để nhận mã mới.');
    }

    if ((pending.attempts || 0) >= MAX_CODE_ATTEMPTS) {
      await this.authRepository.deleteEmailVerification({ id: pending.id });
      throw new BadRequestException(
        'Bạn đã nhập sai mã quá nhiều lần. Vui lòng đăng ký lại để nhận mã xác minh mới.',
      );
    }

    const isMatch = await bcrypt.compare(dto.code, pending.codeHash);
    if (!isMatch) {
      const attempts = await this.authRepository.incrementVerificationAttempts(pending.id);
      const remaining = MAX_CODE_ATTEMPTS - attempts;
      await this.auditService.log({
        action: 'MEMBER_REGISTER_CODE_INVALID',
        entity: 'EmailVerification',
        entityId: pending.id,
        metadata: { email, attempts, remaining },
        ip,
      });

      throw new BadRequestException(
        remaining > 0
          ? `Mã xác minh không đúng. Bạn còn ${remaining} lần thử.`
          : 'Mã xác minh không đúng. Bạn đã hết lượt thử, vui lòng đăng ký lại.',
      );
    }

    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      await this.authRepository.deleteEmailVerification({ id: pending.id });
      throw new ConflictException('Email này đã được sử dụng');
    }

    if (pending.phone) {
      const phoneTaken = await this.authRepository.findUserByPhone(pending.phone);
      if (phoneTaken) {
        await this.authRepository.deleteEmailVerification({ id: pending.id });
        throw new ConflictException(
          `Số điện thoại này đã được dùng cho tài khoản "${phoneTaken.fullName}". Mỗi số điện thoại chỉ được đăng ký 1 hội viên.`,
        );
      }
    }

    const result = await this.authRepository.confirmMemberRegistration({
      email,
      passwordHash: pending.passwordHash,
      fullName: pending.fullName,
      phone: pending.phone,
      gender: pending.gender,
      dateOfBirth: pending.dateOfBirth ? new Date(pending.dateOfBirth) : null,
      address: pending.address ?? null,
      emergencyContact: pending.emergencyContact ?? null,
      branchId: pending.branchId as string,
      verificationId: pending.id,
    });

    await this.auditService.log({
      userId: result.user.id,
      action: 'MEMBER_REGISTER',
      entity: 'Member',
      entityId: result.member.id,
      metadata: {
        email: result.user.email,
        memberCode: result.member.code,
        emailVerified: true,
      },
      ip,
    });

    return {
      message: 'Tạo tài khoản hội viên thành công',
      user: result.user,
      member: result.member,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateCode(): string {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private codeExpiry(): Date {
    return new Date(Date.now() + VERIFY_CODE_TTL_MINUTES * 60_000);
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.authRepository.findUserByEmail(email);
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }
  }

  private async assertPhoneAvailable(phone: string): Promise<void> {
    if (!phone) return;
    const owner = await this.authRepository.findUserByPhone(phone);
    if (owner) {
      throw new ConflictException(
        `Số điện thoại này đã được dùng cho tài khoản "${owner.fullName}". Mỗi số điện thoại chỉ được đăng ký 1 hội viên.`,
      );
    }
  }

  // ===================== QUÊN MẬT KHẨU =====================

  async requestPasswordReset(emailInput: string, ip?: string) {
    const email = this.normalizeEmail(emailInput);
    const user = await this.authRepository.findUserByEmail(email);

    if (user) {
      const pending = await this.authRepository.findPasswordResetByEmail(email);
      if (pending) {
        const lastSentAt = (pending as any).lastSentAt ? new Date((pending as any).lastSentAt) : null;
        if (lastSentAt) {
          const waited = Math.floor((Date.now() - lastSentAt.getTime()) / 1000);
          if (waited < RESEND_COOLDOWN_SECONDS) {
            throw new HttpException(
              `Vui lòng chờ ${RESEND_COOLDOWN_SECONDS - waited} giây nữa rồi gửi lại mã.`,
              HttpStatus.TOO_MANY_REQUESTS,
            );
          }
        }
      }

      const code = this.generateCode();
      const codeHash = await bcrypt.hash(code, 10);
      const expiresAt = this.codeExpiry();

      await this.authRepository.createPasswordReset({ email, codeHash, expiresAt });

      try {
        await this.mailService.sendPasswordResetCode({
          email,
          fullName: user.fullName,
          code,
          expiresInMinutes: VERIFY_CODE_TTL_MINUTES,
        });
      } catch (e) {
        await this.authRepository.deletePasswordReset({ email });
        this.logger.warn(`Gửi mã đặt lại mật khẩu thất bại cho ${email}: ${e instanceof Error ? e.message : e}`);
        throw e;
      }

      await this.auditService.log({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'Auth',
        entityId: user.id,
        metadata: { email },
        ip,
      });
    }

    return {
      message: 'Nếu email này đã đăng ký tài khoản, mã đặt lại mật khẩu đã được gửi về hộp thư của bạn',
      email,
      expiresInSeconds: VERIFY_CODE_TTL_MINUTES * 60,
      resendAfterSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  async resetPassword(emailInput: string, code: string, newPassword: string, ip?: string) {
    const email = this.normalizeEmail(emailInput);
    const pending = await this.authRepository.findPasswordResetByEmail(email);

    if (!pending) {
      throw new BadRequestException('Không tìm thấy yêu cầu đặt lại mật khẩu. Vui lòng gửi mã mới.');
    }

    if (new Date(pending.expiresAt).getTime() < Date.now()) {
      await this.authRepository.deletePasswordReset({ id: pending.id });
      throw new BadRequestException('Mã đặt lại mật khẩu đã hết hạn. Vui lòng gửi mã mới.');
    }

    if ((pending.attempts || 0) >= MAX_CODE_ATTEMPTS) {
      await this.authRepository.deletePasswordReset({ id: pending.id });
      throw new BadRequestException('Bạn đã nhập sai mã quá nhiều lần. Vui lòng gửi mã mới.');
    }

    const isMatch = await bcrypt.compare(code, pending.codeHash);
    if (!isMatch) {
      const attempts = await this.authRepository.incrementResetAttempts(pending.id);
      const remaining = MAX_CODE_ATTEMPTS - attempts;
      throw new BadRequestException(
        remaining > 0
          ? `Mã đặt lại mật khẩu không đúng. Bạn còn ${remaining} lần thử.`
          : 'Mã đặt lại mật khẩu không đúng. Bạn đã hết lượt thử, vui lòng gửi mã mới.',
      );
    }

    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      await this.authRepository.deletePasswordReset({ id: pending.id });
      throw new BadRequestException('Tài khoản không còn tồn tại.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.authRepository.resetPassword(email, passwordHash);

    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      entity: 'Auth',
      entityId: user.id,
      metadata: { email },
      ip,
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }

  // ===================== ĐĂNG NHẬP BẰNG GOOGLE =====================

  async googleLogin(profile: GoogleProfile, ip?: string) {
    if (!profile.email) {
      throw new BadRequestException('Tài khoản Google không có địa chỉ email');
    }
    const email = this.normalizeEmail(profile.email);

    let user = await this.authRepository.findUserByEmail(email);

    if (user && (user as any).providerId && (user as any).providerId !== profile.providerId) {
      throw new BadRequestException('Email này đã liên kết với một tài khoản Google khác');
    }

    if (!user) {
      user = await this.createMemberFromGoogle(email, profile);
    } else if (!(user as any).providerId) {
      user = await this.authRepository.linkGoogleProvider(user.id, profile.providerId, (user as any).avatarUrl || profile.avatarUrl || null);
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị vô hiệu hóa');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    let memberId: string | null = null;
    if (user.role === 'MEMBER') {
      const member = await this.authRepository.findMemberByUserId(user.id);
      if (member) memberId = member.id;
    }

    await this.auditService.log({
      userId: user.id,
      action: 'AUTH_LOGIN',
      entity: 'Auth',
      entityId: user.id,
      metadata: { email: user.email, role: user.role, provider: 'GOOGLE' },
      ip,
    });

    return {
      message: 'Đăng nhập bằng Google thành công',
      accessToken,
      memberId,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  private async createMemberFromGoogle(email: string, profile: GoogleProfile) {
    const branch = await this.authRepository.findActiveBranch();
    if (!branch) {
      throw new BadRequestException('Hệ thống chưa có chi nhánh hoạt động');
    }

    const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const memberPhone = `G-${profile.providerId.slice(0, 15)}`;

    const user = await this.authRepository.createGoogleMember({
      email,
      passwordHash,
      fullName: profile.fullName,
      branchId: branch.id,
      avatarUrl: profile.avatarUrl || null,
      providerId: profile.providerId,
      memberPhone,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'MEMBER_REGISTER',
      entity: 'Member',
      metadata: { email, provider: 'GOOGLE', emailVerified: true },
    });

    return user;
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.authRepository.findUserByEmail(registerDto.email);
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.authRepository.createUser({
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      phone: registerDto.phone,
      role: registerDto.role || 'STAFF',
      branchId: registerDto.branchId,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'USER_CREATE',
      entity: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    return {
      message: 'Tạo tài khoản thành công',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        branchId: user.branchId,
        createdAt: (user as any).createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.getProfile(userId);
    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }
    return user;
  }
}
