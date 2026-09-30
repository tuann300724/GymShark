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
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MemberRegisterDto } from './dto/member-register.dto';
import { VerifyMemberRegisterDto } from './dto/verify-member-register.dto';
import { UserRole } from '@prisma/client';

/** Thời hạn của mã xác minh email (phút) */
const VERIFY_CODE_TTL_MINUTES = 10;
/** Khoảng nghỉ tối thiểu giữa 2 lần gửi mã (giây) — chống spam, đã có @Throttle bổ sung */
const RESEND_COOLDOWN_SECONDS = 60;
/** Số lần nhập sai tối đa trước khi xoá yêu cầu và bắt xin mã mới */
const MAX_CODE_ATTEMPTS = 5;
/** Giữ lại yêu cầu đã hết hạn thêm bao lâu thì dọn (giờ) — dọn mỗi lần có yêu cầu mới */
const EXPIRED_CLEANUP_GRACE_HOURS = 6;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
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

    // If the user is linked to a member profile, attach its id
    let memberId: string | null = null;
    if (user.role === 'MEMBER') {
      const member = await this.prisma.member.findUnique({
        where: { userId: user.id },
        select: { id: true, code: true },
      });
      if (member) memberId = member.id;
    }

    // Nhật ký hoạt động: đăng nhập thành công
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

  // ==============================================================
  //  ĐĂNG KÝ HỘI VIÊN TỰ PHỤC VỤ — 2 BƯỚC, XÁC MINH EMAIL
  // ==============================================================

  /**
   * Bước 1 — nhận thông tin đăng ký, lưu tạm và gửi mã 6 số về email của hội viên.
   *
   * CHƯA tạo User/Member: dữ liệu nằm ở bảng `EmailVerification` cho tới khi bước 2
   * xác minh thành công. Nhờ vậy:
   *   - hệ thống chứng minh được hội viên thực sự sở hữu email đó;
   *   - email bị người khác nhập "để đụng" vẫn có thể đăng ký lại bình thường;
   *   - không sinh tài khoản rác trong bảng User.
   *
   * Nếu gửi email lỗi (SMTP sai, mạng chặn) thì xoá luôn yêu cầu và ném lỗi —
   * không để lại trạng thái nửa vời.
   */
  async requestMemberRegistrationCode(dto: MemberRegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    await this.assertEmailAvailable(email);

    // Dọn yêu cầu cũ đã hết hạn từ lâu (nếu không bảng sẽ phình vô hạn)
    await this.prisma.emailVerification.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - EXPIRED_CLEANUP_GRACE_HOURS * 3600_000) } },
    });

    const branch = await this.prisma.branch.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!branch) {
      throw new BadRequestException('Hệ thống chưa có chi nhánh hoạt động');
    }

    const code = this.generateCode();
    const [codeHash, passwordHash] = await Promise.all([
      bcrypt.hash(code, 10),
      bcrypt.hash(dto.password, 10),
    ]);
    const expiresAt = this.codeExpiry();

    // Ghi đè yêu cầu đang chờ của email này (nếu có) — mỗi email chỉ nên có
    // đúng một mã còn hiệu lực, tránh tồn đọng nhiều bản ghi cùng lúc.
    await this.prisma.emailVerification.deleteMany({ where: { email } });
    await this.prisma.emailVerification.create({
      data: {
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
      },
    });

    try {
      await this.mailService.sendMemberVerificationCode({
        email,
        fullName: dto.fullName,
        code,
        expiresInMinutes: VERIFY_CODE_TTL_MINUTES,
      });
    } catch (e) {
      // Không gửi được mã thì không giữ yêu cầu — người dùng phải đăng ký lại từ đầu
      await this.prisma.emailVerification.deleteMany({ where: { email } });
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

  /**
   * Gửi lại mã xác minh cho yêu cầu đăng ký đang chờ — hội viên không cần nhập lại
   * mật khẩu. Mã cũ mất hiệu lực ngay khi mã mới được sinh.
   */
  async resendMemberVerificationCode(emailInput: string, ip?: string) {
    const email = this.normalizeEmail(emailInput);
    const pending = await this.prisma.emailVerification.findFirst({ where: { email } });

    if (!pending) {
      throw new NotFoundException(
        'Không tìm thấy yêu cầu đăng ký đang chờ. Vui lòng điền lại thông tin để nhận mã mới.',
      );
    }

    const waitedSeconds = Math.floor((Date.now() - pending.lastSentAt.getTime()) / 1000);
    if (waitedSeconds < RESEND_COOLDOWN_SECONDS) {
      throw new HttpException(
        `Vui lòng chờ ${RESEND_COOLDOWN_SECONDS - waitedSeconds} giây nữa rồi gửi lại mã.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = this.codeExpiry();

    await this.prisma.emailVerification.update({
      where: { id: pending.id },
      data: { codeHash, expiresAt, lastSentAt: new Date(), attempts: 0 },
    });

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

  /**
   * Bước 2 — kiểm tra mã 6 số, nếu đúng thì tạo User (role MEMBER) + hồ sơ Member
   * + thông báo chào mừng, rồi xoá yêu cầu đăng ký.
   *
   * Quy tắc bảo mật:
   *   - mã chỉ lưu dạng bcrypt hash, so khớp bằng `bcrypt.compare` (timing-safe);
   *   - sai quá MAX_CODE_ATTEMPTS lần → xoá yêu cầu, buộc xin mã mới;
   *   - hết hạn → xoá yêu cầu;
   *   - kiểm tra lại email còn trống ngay trước lúc tạo (tránh đua điều kiện).
   */
  async confirmMemberRegistration(dto: VerifyMemberRegisterDto, ip?: string) {
    const email = this.normalizeEmail(dto.email);
    const pending = await this.prisma.emailVerification.findFirst({ where: { email } });

    if (!pending) {
      throw new BadRequestException(
        'Không tìm thấy yêu cầu đăng ký đang chờ. Vui lòng đăng ký lại để nhận mã xác minh.',
      );
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      await this.prisma.emailVerification.delete({ where: { id: pending.id } });
      throw new BadRequestException('Mã xác minh đã hết hạn. Vui lòng đăng ký lại để nhận mã mới.');
    }

    if (pending.attempts >= MAX_CODE_ATTEMPTS) {
      await this.prisma.emailVerification.delete({ where: { id: pending.id } });
      throw new BadRequestException(
        'Bạn đã nhập sai mã quá nhiều lần. Vui lòng đăng ký lại để nhận mã xác minh mới.',
      );
    }

    const isMatch = await bcrypt.compare(dto.code, pending.codeHash);
    if (!isMatch) {
      const attempts = pending.attempts + 1;
      await this.prisma.emailVerification.update({
        where: { id: pending.id },
        data: { attempts },
      });

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

    // Email có thể đã bị dùng trong lúc chờ mã (đăng ký ở tab khác / bằng tài khoản cũ)
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      await this.prisma.emailVerification.delete({ where: { id: pending.id } });
      throw new ConflictException('Email này đã được sử dụng');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: pending.passwordHash,
          fullName: pending.fullName,
          phone: pending.phone,
          role: UserRole.MEMBER,
          branchId: pending.branchId,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          status: true,
          branchId: true,
          createdAt: true,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          code: await this.nextMemberCode(tx),
          fullName: pending.fullName,
          email,
          phone: pending.phone,
          gender: pending.gender,
          dateOfBirth: pending.dateOfBirth,
          address: pending.address,
          emergencyContact: pending.emergencyContact,
          branchId: pending.branchId,
        },
        select: {
          id: true,
          code: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
        },
      });

      await tx.notification.create({
        data: {
          memberId: member.id,
          title: 'Chào mừng bạn đến với GymMaster Pro 💪',
          content: `Xin chào ${pending.fullName}! Tài khoản hội viên của bạn đã được xác minh email và tạo thành công. Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của mình.`,
          type: 'SYSTEM',
          link: '/member/membership',
        },
      });

      // Đã xác minh xong — không giữ lại mật khẩu/mã trong bảng chờ
      await tx.emailVerification.delete({ where: { id: pending.id } });

      return { user, member };
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

  // ---- Tiện ích riêng cho luồng đăng ký hội viên ----

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Mã 6 chữ số sinh bằng crypto (Number.random không đủ đồng nhất cho mã bảo mật) */
  private generateCode(): string {
    return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  }

  private codeExpiry(): Date {
    return new Date(Date.now() + VERIFY_CODE_TTL_MINUTES * 60_000);
  }

  private async assertEmailAvailable(email: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }
  }

  /** Sinh mã hội viên dạng MEM-0001, bỏ qua mã đã tồn tại (không đụng khi xoá hội viên) */
  private async nextMemberCode(tx: Prisma.TransactionClient): Promise<string> {
    const count = await tx.member.count();
    for (let i = 1; i <= 500; i++) {
      const code = `MEM-${String(count + i).padStart(4, '0')}`;
      const exists = await tx.member.findUnique({ where: { code }, select: { id: true } });
      if (!exists) return code;
    }
    return `MEM-${Date.now().toString().slice(-8)}`;
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        role: (registerDto.role as UserRole) || UserRole.STAFF,
        branchId: registerDto.branchId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        branchId: true,
        createdAt: true,
      },
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
      user,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        trainer: {
          select: {
            id: true,
            specialization: true,
            rating: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Không tìm thấy thông tin người dùng');
    }

    return user;
  }
}
