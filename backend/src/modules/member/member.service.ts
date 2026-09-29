import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InvoiceStatus, PaymentMethod, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit-logs/audit-logs.service';
import { BANK_INFO } from '../payments/bank-info';
import { UpdateMemberDto } from './dto/update-member.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterMembershipDto } from './dto/register-membership.dto';

@Injectable()
export class MemberService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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

    await this.auditService.log({
      userId,
      action: 'MEMBER_PROFILE_UPDATE',
      entity: 'Member',
      entityId: member.id,
      metadata: { fields: Object.keys(data) },
    });

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

    await this.auditService.log({
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'Auth',
      entityId: userId,
      metadata: null,
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  /** HLV hiện tại đang phụ trách hội viên đang đăng nhập (nếu có) */
  async getTrainer(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return { trainer: null };

    const assignment = await this.prisma.trainerMember.findFirst({
      where: { memberId: member.id, status: 'ACTIVE' },
      include: {
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { trainer: assignment?.trainer ?? null, assignment: assignment ?? null };
  }

  // ---------------------------------------------------------------------------
  // Memberships
  // ---------------------------------------------------------------------------

  /** Đánh dấu các membership ACTIVE đã hết hạn → EXPIRED (backend tự tính, không tin frontend) */
  private async syncExpiredMemberships(memberId?: string) {
    const where: any = { status: 'ACTIVE', endDate: { lt: new Date() } };
    if (memberId) where.memberId = memberId;
    await this.prisma.membership.updateMany({
      where,
      data: { status: 'EXPIRED' },
    });
  }

  /** Tìm memberships đang chờ xác nhận thanh toán của member */
  private async getPendingMembership(memberId: string) {
    return this.prisma.membership.findFirst({
      where: { memberId, status: 'PENDING' },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getActiveMembership(memberId: string) {
    await this.syncExpiredMemberships(memberId);
    return this.prisma.membership.findFirst({
      where: {
        memberId,
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: { package: true },
      orderBy: { endDate: 'desc' },
    });
  }

  /**
   * Tính giá gói từ database (không tin giá frontend gửi lên):
   * originalPrice - discount = finalAmount
   * STEP 8 — cộng thêm: giới hạn tổng lượt (đếm Payment PENDING+PAID) + giới hạn mỗi hội viên.
   */
  private async calcPrice(pkg: { price: Prisma.Decimal }, promotionCode?: string, memberId?: string) {
    const original = new Prisma.Decimal(pkg.price.toString());
    let discount = new Prisma.Decimal(0);
    let promotion: any = null;

    if (promotionCode) {
      promotion = await this.prisma.promotion.findUnique({
        where: { code: promotionCode },
      });
      if (!promotion || promotion.status !== 'ACTIVE') {
        throw new BadRequestException('Mã khuyến mãi không hợp lệ');
      }
      const now = new Date();
      if (now < promotion.startDate || now > promotion.endDate) {
        throw new BadRequestException('Mã khuyến mãi đã hết hạn hoặc chưa có hiệu lực');
      }
      // Giới hạn tổng lượt: đếm Payment PENDING + PAID (giữ chỗ thật, không phụ thuộc usedCount)
      const reserved = await this.prisma.payment.count({
        where: { promotionId: promotion.id, status: { in: ['PENDING', 'PAID'] } },
      });
      if (promotion.usageLimit !== null && reserved >= promotion.usageLimit) {
        throw new BadRequestException('Mã khuyến mãi đã hết lượt sử dụng');
      }
      // Giới hạn mỗi hội viên
      if (memberId && promotion.perMemberLimit !== null && promotion.perMemberLimit !== undefined) {
        const memberUsed = await this.prisma.payment.count({
          where: { promotionId: promotion.id, memberId, status: { in: ['PENDING', 'PAID'] } },
        });
        if (memberUsed >= promotion.perMemberLimit) {
          throw new BadRequestException('Bạn đã dùng hết lượt của mã này');
        }
      }
      if (promotion.minOrderValue !== null && original.lt(new Prisma.Decimal(promotion.minOrderValue.toString()))) {
        throw new BadRequestException(
          `Mã khuyến mãi chỉ áp dụng cho đơn từ ${Number(promotion.minOrderValue).toLocaleString('vi-VN')}đ`,
        );
      }

      const dv = new Prisma.Decimal(promotion.discountValue.toString());
      discount =
        promotion.discountType === 'PERCENTAGE' ? original.mul(dv).div(100) : dv;

      if (promotion.maxDiscount !== null) {
        const maxD = new Prisma.Decimal(promotion.maxDiscount.toString());
        if (discount.gt(maxD)) discount = maxD;
      }
      discount = discount.toDecimalPlaces(2, Prisma.Decimal.ROUND_DOWN);
    }

    let final = original.minus(discount);
    if (final.lt(0)) final = new Prisma.Decimal(0);

    return { original, discount, final, promotion };
  }

  async getMemberships(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return { current: null, pending: null, history: [], memberId: undefined };

    await this.syncExpiredMemberships(member.id);

    const all = await this.prisma.membership.findMany({
      where: { memberId: member.id },
      include: {
        package: true,
        payments: {
          select: { id: true, amount: true, method: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const current =
      all.find((m) => m.status === 'ACTIVE' && m.startDate <= now && m.endDate >= now) || null;
    const pending = all.find((m) => m.status === 'PENDING') || null;
    const history = all; // lịch sử: toàn bộ gói đã đăng ký

    return { current, pending, history, memberId: member.id };
  }

  async getCurrentMembership(userId: string) {
    const member = await this.resolveMember(userId);
    if (!member) return { current: null };
    const current = await this.getActiveMembership(member.id);
    return { current };
  }

  /** Đăng ký gói tập mới (khi chưa có membership đang hoạt động) — luôn tạo Membership + Payment ở trạng thái PENDING */
  async registerMembership(userId: string, dto: RegisterMembershipDto) {
    const member = await this.resolveMember(userId);
    if (!member) throw new ForbiddenException('Chỉ hội viên mới có thể đăng ký gói tập');

    return this.createPendingMembership(member, dto, { actorUserId: userId, via: 'self' });
  }

  /**
   * Lễ tân/quản trị tạo thẻ tập cho hội viên tại quầy (POST /members/:id/memberships).
   * Dùng chung logic với hội viên tự đăng ký — chỉ khác người thực hiện trong audit log.
   */
  async registerMembershipForMember(
    memberId: string,
    dto: RegisterMembershipDto,
    actorUserId: string,
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { branch: { select: { id: true, name: true, code: true } } },
    });
    if (!member) throw new NotFoundException('Không tìm thấy hội viên.');

    return this.createPendingMembership(member, dto, { actorUserId, via: 'staff' });
  }

  /** Thân hành chung: tạo Membership PENDING + Payment PENDING + Invoice ISSUED + notification */
  private async createPendingMembership(
    member: { id: string; code: string; fullName: string },
    dto: RegisterMembershipDto,
    ctx: { actorUserId: string; via: 'self' | 'staff' },
  ) {
    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.packageId } });
    if (!pkg || pkg.status !== 'ACTIVE') {
      throw new NotFoundException('Gói tập không tồn tại hoặc đã ngừng bán');
    }

    await this.syncExpiredMemberships(member.id);

    const active = await this.getActiveMembership(member.id);
    if (active) {
      throw new ConflictException(
        ctx.via === 'staff'
          ? 'Hội viên đang có một gói tập hoạt động. Hãy dùng chức năng "Gia hạn" thay thế.'
          : 'Bạn đang có một gói tập đang hoạt động. Hãy dùng chức năng "Gia hạn" thay thế.',
      );
    }
    const pending = await this.getPendingMembership(member.id);
    if (pending) {
      throw new ConflictException(
        ctx.via === 'staff'
          ? 'Hội viên đang có một yêu cầu đăng ký chờ xác nhận thanh toán. Hãy xử lý ở /admin/payments trước.'
          : 'Bạn đang có một yêu cầu đăng ký đang chờ xác nhận thanh toán.',
      );
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
    const paymentCode = await this.genPaymentCode();

    const { original, discount, final, promotion } = await this.calcPrice(pkg, dto.promotionCode, member.id);

    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          memberId: member.id,
          packageId: pkg.id,
          startDate,
          endDate,
          price: original,
          discountAmount: discount,
          finalAmount: final,
          status: 'PENDING',
        },
        include: { package: true },
      });

      const createdPayment = await tx.payment.create({
        data: {
          code: paymentCode,
          memberId: member.id,
          membershipId: created.id,
          promotionId: promotion?.id || null,
          amount: final,
          discountAmount: discount.gt(0) ? discount : null,
          method: dto.paymentMethod || PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
          notes: `Thanh toán gói ${pkg.name}`,
        },
      });

      // Hóa đơn (Invoice) — invoiceNumber trùng payment code, 1-1 với payment
      const dueDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      await tx.invoice.create({
        data: {
          invoiceNumber: paymentCode,
          memberId: member.id,
          membershipId: created.id,
          paymentId: createdPayment.id,
          subtotal: original,
          discount,
          total: final,
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
          dueDate,
        },
      });

      await tx.notification.create({
        data: {
          memberId: member.id,
          title: 'Đăng ký gói tập thành công 🎟️',
          content: `Bạn vừa đăng ký gói ${pkg.name} (${pkg.durationDays} ngày). Gói tập đang chờ xác nhận thanh toán. Sau khi lễ tân xác nhận, gói sẽ tự động kích hoạt.`,
          type: 'PAYMENT',
          link: '/member/membership',
        },
      });

      return {
        membership: created,
        payment: { id: createdPayment.id, code: paymentCode, amount: final },
      };
    });

    await this.auditService.log({
      userId: ctx.actorUserId,
      action: 'MEMBERSHIP_REGISTER',
      entity: 'Membership',
      entityId: result.membership.id,
      metadata: {
        packageName: pkg.name,
        amount: final,
        paymentCode,
        promotionCode: dto.promotionCode ?? null,
        memberCode: member.code,
        via: ctx.via,
      },
    });

    return {
      message: 'Đã gửi yêu cầu đăng ký. Gói tập sẽ kích hoạt sau khi thanh toán được xác nhận.',
      membership: result.membership,
      payment: result.payment,
    };
  }

  /**
   * Entry point POST /payments/me (STEP 6): renew=true → gia hạn, ngược lại đăng ký mới.
   * Amount luôn do backend tính từ package — frontend không quyết định giá.
   */
  async requestPayment(userId: string, dto: RegisterMembershipDto & { renew?: boolean }) {
    if (dto.renew) return this.renewMembership(userId, dto);
    return this.registerMembership(userId, dto);
  }

  /** Gia hạn gói tập: tạo Membership NÓI TIẾP ngay sau ngày hết hạn gói hiện tại (không overlap), Payment PENDING */
  async renewMembership(userId: string, dto: RegisterMembershipDto) {
    const member = await this.resolveMember(userId);
    if (!member) throw new ForbiddenException('Chỉ hội viên mới có thể gia hạn gói tập');

    const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: dto.packageId } });
    if (!pkg || pkg.status !== 'ACTIVE') {
      throw new NotFoundException('Gói tập không tồn tại hoặc đã ngừng bán');
    }

    await this.syncExpiredMemberships(member.id);

    const active = await this.getActiveMembership(member.id);
    if (!active) {
      // Không có gói đang chạy → tạo mới
      return this.registerMembership(userId, dto);
    }

    const pending = await this.getPendingMembership(member.id);
    if (pending) {
      throw new ConflictException('Bạn đang có một yêu cầu gia hạn đang chờ xác nhận thanh toán.');
    }

    // startDate = endDate của gói hiện tại + 1 ngày → không bị overlap
    const startDate = new Date(active.endDate.getTime() + 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
    const paymentCode = await this.genPaymentCode();

    const { original, discount, final, promotion } = await this.calcPrice(pkg, dto.promotionCode, member.id);

    const result = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          memberId: member.id,
          packageId: pkg.id,
          startDate,
          endDate,
          price: original,
          discountAmount: discount,
          finalAmount: final,
          status: 'PENDING',
        },
        include: { package: true },
      });

      const createdPayment = await tx.payment.create({
        data: {
          code: paymentCode,
          memberId: member.id,
          membershipId: created.id,
          promotionId: promotion?.id || null,
          amount: final,
          discountAmount: discount.gt(0) ? discount : null,
          method: dto.paymentMethod || PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
          notes: `Gia hạn gói ${pkg.name} (+${pkg.durationDays} ngày)`,
        },
      });

      // Hóa đơn gia hạn
      const dueDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      await tx.invoice.create({
        data: {
          invoiceNumber: paymentCode,
          memberId: member.id,
          membershipId: created.id,
          paymentId: createdPayment.id,
          subtotal: original,
          discount,
          total: final,
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
          dueDate,
        },
      });

      await tx.notification.create({
        data: {
          memberId: member.id,
          title: 'Yêu cầu gia hạn đã được tiếp nhận 🔄',
          content: `Gói ${pkg.name} của bạn sẽ nối tiếp sau khi gói hiện tại hết hạn (từ ${startDate.toLocaleDateString('vi-VN')}). Đang chờ xác nhận thanh toán.`,
          type: 'PAYMENT',
          link: '/member/membership',
        },
      });

      return {
        membership: created,
        payment: { id: createdPayment.id, code: paymentCode, amount: final },
      };
    });

    await this.auditService.log({
      userId,
      action: 'MEMBERSHIP_RENEW',
      entity: 'Membership',
      entityId: result.membership.id,
      metadata: {
        packageName: pkg.name,
        amount: final,
        paymentCode,
        promotionCode: dto.promotionCode ?? null,
      },
    });

    return {
      message: 'Đã gửi yêu cầu gia hạn. Gói mới sẽ có hiệu lực từ ngày gói hiện tại hết hạn.',
      membership: result.membership,
      payment: result.payment,
    };
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
        membership: { include: { package: { select: { id: true, name: true, durationDays: true } } } },
        promotion: { select: { id: true, code: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true, status: true } },
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
        member: { select: { id: true, code: true, fullName: true, phone: true, email: true, joinedAt: true } },
        membership: {
          include: {
            package: { select: { id: true, name: true, durationDays: true, price: true } },
          },
        },
        promotion: { select: { id: true, code: true, name: true } },
        invoice: true,
        confirmedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    if (!payment) throw new NotFoundException('Không tìm thấy hóa đơn');

    // Thông tin chuyển khoản nếu chọn BANK_TRANSFER (chưa xác nhận mới cần ghi nội dung)
    let bankInfo: any = null;
    if (payment.method === 'BANK_TRANSFER') {
      bankInfo = {
        bankName: BANK_INFO.bankName,
        accountName: BANK_INFO.accountName,
        accountNumber: BANK_INFO.accountNumber,
        branch: BANK_INFO.branch,
        transferContent: `GYM ${payment.member.code} ${payment.code}`,
      };
    }

    return { ...payment, bankInfo };
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
        pendingMembership: null,
      };
    }

    await this.syncExpiredMemberships(member.id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((startOfWeek.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    const [totalCheckIns, monthCheckIns, weekCheckIns, ptSessions, memberships, upcomingSessions, monthSessions, completedSessions, paidAgg, lastPayment, pendingPayments] =
      await Promise.all([
        this.prisma.checkIn.count({ where: { memberId: member.id } }),
        this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfMonth } } }),
        this.prisma.checkIn.count({ where: { memberId: member.id, checkInTime: { gte: startOfWeek } } }),
        this.prisma.trainingSchedule.count({ where: { memberId: member.id, startTime: { gte: now } } }),
        this.prisma.membership.findMany({
          where: { memberId: member.id },
          include: { package: true },
          orderBy: { endDate: 'desc' },
        }),
        this.prisma.trainingSchedule.count({
          where: { memberId: member.id, status: 'SCHEDULED', startTime: { gte: now } },
        }),
        this.prisma.trainingSchedule.count({
          where: { memberId: member.id, startTime: { gte: startOfMonth, lt: new Date(now.getFullYear(), now.getMonth() + 1, 1) } },
        }),
        this.prisma.trainingSchedule.count({
          where: { memberId: member.id, status: 'COMPLETED' },
        }),
        // Tổng tiền đã thanh toán thành công (không tính REFUNDED — đã hạch toán riêng)
        this.prisma.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { memberId: member.id, status: 'PAID' },
        }),
        this.prisma.payment.findFirst({
          where: { memberId: member.id, status: 'PAID' },
          orderBy: { paidAt: 'desc' },
          select: { id: true, code: true, amount: true, method: true, paidAt: true },
        }),
        this.prisma.payment.count({
          where: { memberId: member.id, status: 'PENDING' },
        }),
      ]);

    const trainerAssignment = await this.prisma.trainerMember.findFirst({
      where: { memberId: member.id, status: 'ACTIVE' },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, phone: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const active = memberships.find((m) => m.status === 'ACTIVE' && m.startDate <= now && m.endDate >= now) || null;
    const pending = memberships.find((m) => m.status === 'PENDING') || null;
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
      upcomingSessions,
      monthSessions,
      completedSessions,
      trainer: trainerAssignment?.trainer ?? null,
      paymentSummary: {
        totalSpent: paidAgg._sum.amount ?? 0,
        paidCount: paidAgg._count,
        pendingCount: pendingPayments,
        lastPayment,
      },
      currentMembership: active
        ? {
            id: active.id,
            packageId: active.packageId,
            packageName: active.package.name,
            price: active.finalAmount ?? active.price,
            startDate: active.startDate,
            endDate: active.endDate,
            status: active.status,
            remainingDays,
            progress: membershipProgress,
          }
        : null,
      pendingMembership: pending
        ? {
            id: pending.id,
            packageId: pending.packageId,
            packageName: pending.package.name,
            amount: pending.finalAmount ?? pending.price,
            createdAt: pending.createdAt,
            status: pending.status,
          }
        : null,
    };
  }
}