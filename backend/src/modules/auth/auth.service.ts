import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { MemberRegisterDto } from './dto/member-register.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async login(loginDto: LoginDto) {
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

  /**
   * Public self-registration for a gym MEMBER.
   * Creates a User (role MEMBER) + a linked Member profile + a welcome notification.
   */
  async registerMember(dto: MemberRegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const defaultBranch = await this.prisma.branch.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!defaultBranch) {
      throw new BadRequestException('Hệ thống chưa có chi nhánh hoạt động');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const memberCount = await this.prisma.member.count();
    const memberCode = `MEM-${String(memberCount + 1).padStart(4, '0')}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: UserRole.MEMBER,
          branchId: defaultBranch.id,
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
          code: memberCode,
          fullName: dto.fullName,
          email: normalizedEmail,
          phone: dto.phone,
          gender: dto.gender || 'MALE',
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          address: dto.address || null,
          emergencyContact: dto.emergencyContact || null,
          branchId: defaultBranch.id,
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
          content: `Xin chào ${dto.fullName}! Tài khoản hội viên của bạn đã được tạo thành công. Hãy chọn một gói tập phù hợp để bắt đầu hành trình fitness của mình.`,
          type: 'SYSTEM',
          link: '/member/membership',
        },
      });

      return { user, member };
    });

    return {
      message: 'Tạo tài khoản hội viên thành công',
      user: result.user,
      member: result.member,
    };
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
