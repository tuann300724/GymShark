import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PaymentMethod, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterMembershipDto } from './dto/register-membership.dto';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Tìm Member profile gắn với user đang đăng nhập (nếu có) */
  private async resolveMember(userId: string) {
    return this.prisma.member.findUnique({
      where: { userId },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
  }

  private async resolveTrainer(userId: string) {
    return this.prisma.trainer.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
    });
  }

  private async genPaymentCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.payment.count();
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ---------------------------------------------------------------------------
  // Profile
  // ---------------------------------------------------------------------------

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, phone: true, role: true, avatarUrl: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const member = await this.resolveMember(userId);

    if (!member) {
      // Trainer (hoặc user chưa có hồ sơ hội viên) - trả thông tin cơ bản
      return {
        isTrainer: user.role === UserRole.TRAINER,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        member: null,
      };
    }

    return {
      isTrainer: false,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      member: {
        id: member.id,
        code: member.code,
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth,
        address: member.address,
        avatarUrl: member.avatarUrl,
        emergencyContact: member.emergencyContact,
        status: member.status,
        joinedAt: member.joinedAt,
        branch: member.branch,
      },
    };
  }

  async updateMe(userId: string, dto: UpdateMemberDto) {
    const member = await this.resolveMember(userId);
    if (!member) throw new ForbiddenException('Bạn chưa có hồ sơ hội viên');

    const data: any = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.phone) data.phone = dto.phone;
    if (dto.gender) data.gender = dto.gender;
    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.emergencyContact !== undefined) data.emergencyContact = dto.emergencyContact;

    const [, updatedMember] = await this.prisma.$transaction([
      // Đồng bộ thông tin sang User để login/hiển thị thống nhất
      this.prisma.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName ?? undefined,
          phone: dto.phone ?? undefined,
          avatarUrl: dto.avatarUrl ?? undefined,
        },
      }),
      this.prisma.member.update({ where: { id: member.id }, data }),
    ]);

    return { message: 'Cập nhật hồ sơ thành công', member: updatedMember };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mật khẩu hiện tại không chính xác');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    return { message: 'Đổi mật khẩu thành công' };
  }

  // ---------------------------------------------------------------------------
  // Memberships
  // ---------------------------------------------------------------------------

  private async getActiveMembership(memberId: string) {
    return this.prisma.membership.findFirst({
      where: { memberId, status: 'ACTIVE', endDate: { gte: new Date() } },
      include: { package: true },
      orderBy: { endDate: 'desc' },
    });
  }

  async getMemberships(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return { current: null, history: [] };

    const all = await this.prisma.membership.findMany({
      where: { memberId: member.id },
      include: { package: true, payments: { select: { id: true, amount: true, method: true, status: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const current = all.find((m) => m.status === 'ACTIVE' && m.endDate >= new Date()) || null;
    const history = all; // lịch sử: toàn bộ gói đã đăng ký

    return { current, history, memberId: member.id };
  }

  async getCurrentMembership(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return { current: null };
    const current = await this.getActiveMembership(member.id);
    return { current };
  }

  /** Đăng ký gói tập mới (khi chưa có membership đang hoạt động) */
  async registerMembership(userId: string, dto: RegisterMembershipDto) {
    const member = await this.resolveMember(userId);
    if (!member) throw new ForbiddenException('Chỉ hội viên mới có thể đăng ký gói tập');

    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.packageId } });
    if (!pkg || pkg.status !== 'ACTIVE') {
      throw new NotFoundException('Gói tập không tồn tại hoặc đã ngừng bán');
    }

    const active = await this.getActiveMembership(member.id);
    if (active) {
      throw new ConflictException('Bạn đang có một gói tập đang hoạt động. Hãy dùng chức năng "Gia hạn" thay thế.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
    const paymentCode = await this.genPaymentCode();

    const membership = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          memberId: member.id,
          packageId: pkg.id,
          startDate,
          endDate,
          price: pkg.price,
          status: 'ACTIVE',
        },
        include: { package: true },
      });

      await tx.payment.create({
        data: {
          code: paymentCode,
          memberId: member.id,
          membershipId: created.id,
          amount: pkg.price,
          method: dto.paymentMethod || PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          notes: `Thanh toán gói ${pkg.name}`,
        },
      });

      await tx.notification.create({
        data: {
          memberId: member.id,
          title: 'Đăng ký gói tập thành công 🎉',
          content: `Bạn vừa đăng ký gói ${pkg.name} (${pkg.durationDays} ngày). Gói tập có hiệu lực đến ${endDate.toLocaleDateString('vi-VN')}.`,
          type: 'PAYMENT',
          link: '/member/membership',
        },
      });

      return created;
    });

    return { message: 'Đăng ký gói tập thành công', membership };
  }

  /** Gia hạn gói tập hiện tại (hoặc tạo mới nếu chưa có) */
  async renewMembership(userId: string, dto: RegisterMembershipDto) {
    const member = await this.resolveMember(userId);
    if (!member) throw new ForbiddenException('Chỉ hội viên mới có thể gia hạn gói tập');

    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.packageId } });
    if (!pkg || pkg.status !== 'ACTIVE') {
      throw new NotFoundException('Gói tập không tồn tại hoặc đã ngừng bán');
    }

    const active = await this.getActiveMembership(member.id);
    const paymentCode = await this.genPaymentCode();

    if (!active) {
      // Không có gói đang chạy → tạo mới
      return this.registerMembership(userId, dto);
    }

    const extraDays = pkg.durationDays;
    const newEndDate = new Date(active.endDate.getTime() + extraDays * 24 * 60 * 60 * 1000);

    const membership = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.membership.update({
        where: { id: active.id },
        data: {
          packageId: pkg.id,
          endDate: newEndDate,
          price: { increment: pkg.price },
        },
        include: { package: true },
      });

      await tx.payment.create({
        data: {
          code: paymentCode,
          memberId: member.id,
          membershipId: updated.id,
          amount: pkg.price,
          method: dto.paymentMethod || PaymentMethod.CASH,
          status: PaymentStatus.COMPLETED,
          notes: `Gia hạn gói ${pkg.name} (+${pkg.durationDays} ngày)`,
        },
      });

      await tx.notification.create({
        data: {
          memberId: member.id,
          title: 'Gia hạn gói tập thành công 🔄',
          content: `Gói tập của bạn đã được gia hạn thêm ${pkg.durationDays} ngày. Hạn sử dụng mới: ${newEndDate.toLocaleDateString('vi-VN')}.`,
          type: 'PAYMENT',
          link: '/member/membership',
        },
      });

      return updated;
    });

    return { message: 'Gia hạn gói tập thành công', membership };
  }

  // ---------------------------------------------------------------------------
  // Check-ins
  // ---------------------------------------------------------------------------

  async getCheckins(userId: string, page = 1, limit = 10) {
    const member = await this.resolveMember(userId);
    if (!member) {
      return { data: [], total: 0, page, limit, stats: { total: 0, month: 0, week: 0 } };
    }

    const skip = (page - 1) * limit;
    const where = { memberId: member.id };

    const [data, total] = await Promise.all([
      this.prisma.checkIn.findMany({
        where,
        include: { branch: { select: { id: true, name: true, code: true } } },
        orderBy: { checkInTime: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.checkIn.count({ where }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    const day = (startOfWeek.getDay() + 6) % 7; // Monday = 0
    startOfWeek.setDate(now.getDate() - day);
    startOfWeek.setHours(0, 0, 0, 0);

    const [month, week] = await Promise.all([
      this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfMonth } } }),
      this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfWeek } } }),
    ]);

    return { data, total, page, limit, stats: { total, month, week } };
  }

  // ---------------------------------------------------------------------------
  // Schedules
  // ---------------------------------------------------------------------------

  async getSchedules(userId: string) {
    const now = new Date();
    const member = await this.resolveMember(userId);

    // Nếu là trainer → lịch dạy của chính họ
    const trainer = await this.resolveTrainer(userId);

    let where: any = {};
    if (member) {
      where = { memberId: member.id, startTime: { gte: now } };
    } else if (trainer) {
      where = { trainerId: trainer.id, startTime: { gte: now } };
    } else {
      return { data: [], upcoming: 0 };
    }

    const data = await this.prisma.trainingSchedule.findMany({
      where,
      include: {
        trainer: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        room: { select: { id: true, name: true, capacity: true } },
        member: { select: { id: true, code: true, fullName: true } },
      },
      orderBy: { startTime: 'asc' },
      take: 30,
    });

    return { data, upcoming: data.length };
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async getPayments(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return [];

    return this.prisma.payment.findMany({
      where: { memberId: member.id },
      include: {
        membership: { include: { package: { select: { id: true, name: true } } } },
        promotion: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentDetail(userId: string, paymentId: string) {
    const member = await this.resolveMember(userId);
    if (!member) throw new NotFoundException('Không tìm thấy hóa đơn');

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, memberId: member.id },
      include: {
        member: { select: { id: true, code: true, fullName: true, phone: true, email: true } },
        membership: { include: { package: { select: { id: true, name: true, durationDays: true } } } },
        promotion: { select: { id: true, code: true, name: true } },
      },
    });

    if (!payment) throw new NotFoundException('Không tìm thấy hóa đơn');
    return payment;
  }

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  async getNotifications(userId: string) {
    const member = await this.resolveMember(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!member && user?.role !== 'TRAINER') {
      return { data: [], unreadCount: 0 };
    }

    const where: any = {};
    if (member) where.memberId = member.id;
    else where.userId = userId;

    const [data, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({ where: { ...where, isRead: false } }),
    ]);

    return { data, unreadCount };
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const member = await this.resolveMember(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });

    const where: any = { id: notificationId };
    if (member) where.memberId = member.id;
    else if (user?.role === 'TRAINER') where.userId = userId;

    const notif = await this.prisma.notification.findFirst({ where });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');

    await this.prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
    return { message: 'Đã đánh dấu là đã đọc' };
  }

  async markAllNotificationsRead(userId: string) {
    const member = await this.resolveMember(userId);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });

    const where: any = {};
    if (member) where.memberId = member.id;
    else if (user?.role === 'TRAINER') where.userId = userId;

    const result = await this.prisma.notification.updateMany({
      where: { ...where, isRead: false },
      data: { isRead: true },
    });

    return { message: 'Đã đánh dấu tất cả là đã đọc', updated: result.count };
  }

  // ---------------------------------------------------------------------------
  // Dashboard stats
  // ---------------------------------------------------------------------------

  async getStats(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) {
      return {
        isTrainer: true,
        totalCheckIns: 0,
        monthCheckIns: 0,
        weekCheckIns: 0,
        remainingDays: 0,
        membershipProgress: 0,
        ptSessions: 0,
        currentMembership: null,
      };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalCheckIns, monthCheckIns, weekCheckIns, ptSessions, memberships] = await Promise.all([
      this.prisma.checkIn.count({ where: { memberId: member.id } }),
      this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfMonth } } }),
      this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfWeek } } }),
      this.prisma.trainingSchedule.count({ where: { memberId: member.id, startTime: { gte: now } } }),
      this.prisma.membership.findMany({
        where: { memberId: member.id },
        include: { package: true },
        orderBy: { endDate: 'desc' },
        take: 1,
      }),
    ]);

    const active = memberships.find((m) => m.status === 'ACTIVE' && m.endDate >= now) || null;
    let remainingDays = 0;
    let membershipProgress = 0;
    if (active) {
      const totalMs = active.endDate.getTime() - active.startDate.getTime();
      const elapsedMs = now.getTime() - active.startDate.getTime();
      remainingDays = Math.max(0, Math.ceil((active.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
      membershipProgress = totalMs > 0 ? Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100))) : 0;
    }

    return {
      isTrainer: false,
      totalCheckIns,
      monthCheckIns,
      weekCheckIns,
      remainingDays,
      membershipProgress,
      ptSessions,
      currentMembership: active
        ? {
            id: active.id,
            packageId: active.packageId,
            packageName: active.package.name,
            price: active.price,
            startDate: active.startDate,
            endDate: active.endDate,
            status: active.status,
            remainingDays,
            progress: membershipProgress,
          }
        : null,
    };
  }
}